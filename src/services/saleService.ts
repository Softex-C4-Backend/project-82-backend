import { prisma } from '../database/prisma';
import { PaymentMethod, SaleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// DTO para Item de Venda
interface SaleItemInput {
  productId: string;
  quantity: number;
}

// DTO para Criação de Venda
interface CreateSaleDTO {
  userId: string;
  paymentMethod: PaymentMethod;
  items: SaleItemInput[];
}

export class SaleService {
  // === 1. CRIAR VENDA COM LÓGICA FEFO ===
  async createSale({ userId, paymentMethod, items }: CreateSaleDTO) {
    
    // 1.1. Validação Básica
    if (!items || items.length === 0) {
      throw new Error('Uma venda deve conter pelo menos um item.');
    }

    // 1.2. Agrupar itens duplicados (consolidar quantidades)
    const groupedItems = items.reduce((acc, item) => {
      if (item.quantity <= 0) throw new Error('A quantidade de cada item deve ser maior que zero.');
      
      const existing = acc.find(i => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as SaleItemInput[]);

    
    return await prisma.$transaction(async (tx) => {
      // 3. Snapshot do Vendedor
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Vendedor não encontrado no sistema.');

      let totalSaleValue = new Decimal(0);
      const saleItemsToCreate = [];

      // 4. Processar cada produto (já agrupado)
      for (const item of groupedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            batches: {
              where: { currentQuantity: { gt: 0 } },
              orderBy: { expirationDate: 'asc' }, // FEFO: Primeiro que vence, sai antes
            },
          },
      });
      
      if (!product) throw new Error(`Produto ${item.productId} não encontrado.`);

      // REGRA CRÍTICA: Bloquear venda de produto inativo
      if (!product.isAvailable) {
        throw new Error(`O produto ${product.name} não está disponível para venda.`);
      }

      // --- NOVA LÓGICA: FILTRAR LOTES VENCIDOS ---
      const now = new Date();
      
      // 1. Separa apenas os lotes onde a data de validade é maior ou igual a agora
      const validBatches = product.batches.filter(batch => new Date(batch.expirationDate) >= now);

      // 2. Calcula quanto estoque VÁLIDO nós temos (ignora o saldo de lotes vencidos)
      const totalValidStock = validBatches.reduce((acc, batch) => acc + batch.currentQuantity, 0);

      // 3. Validação de Estoque Real
      if (totalValidStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}. (Solicitado: ${item.quantity}, Disponível Válido: ${totalValidStock}). Verifique se há lotes vencidos.`);
      }

      let remainingToExit = item.quantity;
      const batchesUsedData = [];

      // 5. Baixa nos Lotes (Agora iteramos sobre validBatches, e não product.batches)
      for (const batch of validBatches) {
        if (remainingToExit <= 0) break;

        const amountFromThisBatch = Math.min(batch.currentQuantity, remainingToExit);
      
        await tx.batch.update({
          where: { id: batch.id },
          data: { currentQuantity: { decrement: amountFromThisBatch } },
        });

        batchesUsedData.push({
          batchId: batch.id,
          quantity: amountFromThisBatch,
          unitCost: batch.unitCost,
        });

        remainingToExit -= amountFromThisBatch;
      }

      // Trava de segurança (Lotes vs Global)
        if (remainingToExit > 0) {
          throw new Error(`Inconsistência de estoque: os lotes do produto ${product.name} não somam a quantidade necessária.`);
        }

        // 6. Atualização do Produto Global
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        // Se a venda esgotou um lote, o custo do produto deve "pular" para o próximo lote da fila
        await this.updateProductCost(tx, item.productId);

        // 7. Cálculos Financeiros
        const itemUnitPrice = product.price;
        const itemSubTotal = itemUnitPrice.mul(item.quantity);
        totalSaleValue = totalSaleValue.add(itemSubTotal);

        saleItemsToCreate.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: itemUnitPrice,
          subTotal: itemSubTotal,
          batches: {
            create: batchesUsedData,
          },
        });
      }

      // 8. Criação do registro de Venda
      return await tx.sale.create({
        data: {
          userId,
          userName: user.name,
          paymentMethod,
          totalValue: totalSaleValue,
          status: SaleStatus.COMPLETED,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: {
            include: { batches: true },
          },
        },
      });
    });
  }

  // === 2. CANCELAR VENDA (Estorno) ===
  async cancelSale(saleId: string, reason: string) {

    if (!reason || reason.trim().length < 5) {
      throw new Error('Informe um motivo válido para o cancelamento (mínimo 5 caracteres).');
    }
    
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: { include: { batches: true } } },
      });

      if (!sale) throw new Error('Venda não encontrada.');
      if (sale.status === SaleStatus.CANCELED) {
        throw new Error('Esta venda já foi cancelada.');
      }

      for (const item of sale.items) {
        // Estorno por Lote (Preciso)
        for (const sib of item.batches) {
          await tx.batch.update({
            where: { id: sib.batchId },
            data: { currentQuantity: { increment: sib.quantity } },
        });
              }
        // Estorno Global
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await this.updateProductCost(tx, item.productId);
      }

      return await tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.CANCELED,
          cancelReason: reason,
          canceledAt: new Date(),
        },
      });
    });
  }

  // === 3. LISTAR VENDAS COM TRANSFORMAÇÃO DE DADOS ===
  async listSales() {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { 
            name: true, 
            email: true,       
            registration: true 
          } 
        },
        _count: { select: { items: true } }
      }
    });

    // Mapeamento: Transforma o "_count" do Prisma em "itemCount" para o front-end
    return sales.map(sale => {
      return {
        ...sale,
        itemCount: sale._count.items,
        _count: undefined // Remove o objeto _count original
      };
    });
  }

  // === 4. BUSCAR VENDA POR ID ===
    async getSaleById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            batches: { include: { batch: true } }
          }
        },
        user: { 
          select: { 
            name: true, 
            email: true,       
            registration: true  
          } 
        },
      }
    });

    if (!sale) throw new Error('Venda não encontrada.');
    return sale;
  }

  // === 5. LISTAR VENDAS DE UM VENDEDOR ESPECÍFICO ===
  // Útil para o front-end na tela "Minhas Vendas"
  async listSalesByVendor(userId: string) {
    const sales = await prisma.sale.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } }
      }
    });

    return sales.map(sale => {
      return {
        ...sale,
        itemCount: sale._count.items,
        _count: undefined
      };
    });
  }


  private async updateProductCost(tx: any, productId: string) {
    // 1. Busca o lote mais próximo de vencer que ainda tem estoque (FEFO/FIFO)
    const oldestBatch = await tx.batch.findFirst({
      where: { 
        productId, 
        currentQuantity: { gt: 0 } 
      },
      orderBy: { expirationDate: 'asc' },
    });

    // 2. Busca o custo atual registrado no produto para comparação
    const currentProduct = await tx.product.findUnique({
      where: { id: productId },
      select: { cost: true }
    });

    // Se não houver lote com estoque, mantemos o custo como está ou poderíamos zerar
    if (!oldestBatch) return;

    // 3. Só faz o update se o custo for diferente (Performance: evita escritas inúteis no banco)
    const newCost = oldestBatch.unitCost.toString();
    const currentCost = currentProduct?.cost?.toString();

    if (newCost !== currentCost) {
      await tx.product.update({
        where: { id: productId },
        data: { cost: oldestBatch.unitCost },
      });
    }
  }
}