import { prisma } from '../database/prisma';
import { PaymentMethod, SaleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// DTO para Item de Venda
interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

// DTO para Criação de Venda
interface CreateSaleDTO {
  userId: string;
  paymentMethod: PaymentMethod;
  items: SaleItemInput[];
}

export class SaleService {
  // === 1. CRIAR VENDA COM LÓGICA DE PREÇO AUTOMÁTICO E FEFO ===
  async createSale({ userId, paymentMethod, items }: CreateSaleDTO) {
    if (!items || items.length === 0) throw new Error('Uma venda deve conter pelo menos um item.');

    // Consolidação de itens (agora aceita itens sem unitPrice)
    const groupedItems = items.reduce((acc, item) => {
      if (item.quantity <= 0) throw new Error('Quantidade deve ser maior que zero.');
      const existing = acc.find(i => i.productId === item.productId && i.unitPrice === item.unitPrice);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as SaleItemInput[]);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Vendedor não encontrado.');

      let totalSaleValue = new Decimal(0);
      const saleItemsToCreate = [];

      for (const item of groupedItems) {
        // Buscamos o produto incluindo as promoções
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            promotions: { where: { isActive: true } },
            batches: {
              where: { currentQuantity: { gt: 0 } },
              orderBy: { expirationDate: 'asc' },
            },
          },
        });

        if (!product) throw new Error(`Produto ${item.productId} não encontrado.`);
        if (!product.isAvailable) throw new Error(`Produto ${product.name} indisponível.`);

        // --- VALIDAÇÃO E DEFINIÇÃO DE PREÇO (LÓGICA AUTOMÁTICA) ---
        const { originalPrice, promotionalPrice } = this.calculateExpectedPrices(product);
        
        // O sistema prioriza a promoção ativa; se não houver, usa o preço original
        const expectedPrice = promotionalPrice || originalPrice;

        // Se o unitPrice não foi enviado no JSON, o sistema usa o expectedPrice automaticamente
        const finalPrice = item.unitPrice !== undefined 
          ? new Decimal(item.unitPrice).toDecimalPlaces(2) 
          : expectedPrice;

        // Trava de Segurança: Mesmo que enviado, o preço deve bater com o esperado pelo sistema
        if (!finalPrice.equals(expectedPrice)) {
          throw new Error(
            `Preço inválido para ${product.name}. Enviado: ${finalPrice}, Esperado: ${expectedPrice}`
          );
        }

        // --- LÓGICA DE ESTOQUE (FEFO) ---
        const now = new Date();
        const validBatches = product.batches.filter(b => new Date(b.expirationDate) >= now);
        const totalValidStock = validBatches.reduce((acc, b) => acc + b.currentQuantity, 0);

        if (totalValidStock < item.quantity) {
          throw new Error(`Estoque insuficiente (válido) para ${product.name}.`);
        }

        let remainingToExit = item.quantity;
        const batchesUsedData = [];

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

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await this.updateProductCost(tx, item.productId);

        // --- CÁLCULOS FINAIS USANDO O PREÇO DEFINIDO PELO BACKEND ---
        const itemSubTotal = finalPrice.mul(item.quantity);
        totalSaleValue = totalSaleValue.add(itemSubTotal);

        saleItemsToCreate.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: finalPrice, 
          subTotal: itemSubTotal,
          batches: { create: batchesUsedData },
        });
      }

      return await tx.sale.create({
        data: {
          userId,
          userName: user.name,
          paymentMethod,
          totalValue: totalSaleValue,
          items: { create: saleItemsToCreate },
        },
        include: { items: { include: { batches: true } } },
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

  // Método auxiliar interno para calcular o preço esperado (Original ou Promoção)
  private calculateExpectedPrices(product: any) {
    const now = new Date();
    const originalPrice = new Decimal(product.price);
    
    // Busca promoção ativa
    const activePromo = product.promotions?.find((p: any) => {
      return p.isActive && now >= p.startDate && now <= p.endDate;
    });

    let promotionalPrice: Decimal | null = null;

    if (activePromo) {
      const discount = new Decimal(activePromo.discountValue);
      if (activePromo.discountType === 'PERCENTAGE') {
        // Preço = Preço - (Preço * (Desconto / 100))
        promotionalPrice = originalPrice.sub(originalPrice.mul(discount.div(100)));
      } else {
        // Preço = Preço - Desconto Fixo
        promotionalPrice = originalPrice.sub(discount);
      }
    }

    return {
      originalPrice: originalPrice.toDecimalPlaces(2),
      promotionalPrice: promotionalPrice ? promotionalPrice.toDecimalPlaces(2) : null
    };
  }
}