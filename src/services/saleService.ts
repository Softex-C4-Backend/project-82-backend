import { prisma } from '../database/prisma';
import { PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// DTO para Item de Venda
interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

// DTO para Criação de Venda
interface CreateSaleInput {
  userId: string;
  items: CreateSaleItemInput[];
  paymentMethod: PaymentMethod;
}

// DTO para transformação da listagem
interface SaleResponse {
  id: string;
  userId: string;
  userName: string;
  totalValue: string | Decimal;
  paymentMethod: string;
  status: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SaleService {

  // === 1. CRIAR VENDA COM LÓGICA FEFO ===
  async createSale({ userId, items, paymentMethod }: CreateSaleInput) {
    
    // 1.1. Validação Básica
    if (!items || items.length === 0) {
      throw new Error('Uma venda deve conter pelo menos um item.');
    }

    // 1.2. Agrupar itens duplicados (consolidar quantidades)
    const groupedItems = this.groupDuplicateItems(items);

    // 1.3. Validar estoque e precificar cada item
    const enrichedItems = await Promise.all(
      groupedItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado.`);
        }

        if (!product.isAvailable) {
          throw new Error(`Produto ${product.name} não está disponível para venda.`);
        }

        // Verifica se há estoque total
        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Quantidade insuficiente do produto ${product.name}. Disponível: ${product.stockQuantity}, Solicitado: ${item.quantity}`
          );
        }

        return {
          ...item,
          productName: product.name,
          unitPrice: product.price
        };
      })
    );

    // 1.4. Executar tudo em uma transação (Atomic Operation)
    const sale = await prisma.$transaction(async (tx) => {
      
      // Calcular valor total
      let totalValue = new Decimal(0);
      enrichedItems.forEach((item) => {
        const itemTotal = new Decimal(item.unitPrice).mul(item.quantity);
        totalValue = totalValue.add(itemTotal);
      });

      // Buscar o nome do vendedor (snapshot)
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuário (vendedor) não encontrado.');
      }

      // Criar a Venda Principal
      const newSale = await tx.sale.create({
        data: {
          userId,
          userName: user.name,
          totalValue,
          paymentMethod,
          status: 'COMPLETED'
        }
      });

      // Processar cada item da venda
      for (const item of enrichedItems) {
        
        // Buscar lotes do produto ordenados por data de vencimento (FEFO)
        const batches = await tx.batch.findMany({
          where: {
            productId: item.productId,
            currentQuantity: { gt: 0 } // Apenas lotes com quantidade disponível
          },
          orderBy: { expirationDate: 'asc' } // Primeiro os que vence mais cedo
        });

        if (batches.length === 0) {
          throw new Error(`Nenhum lote disponível para o produto ${item.productName}.`);
        }

        // Criar o Item de Venda (snapshot)
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }
        });

        // Distribuir a quantidade entre lotes (FEFO)
        let remainingQuantity = item.quantity;

        for (const batch of batches) {
          if (remainingQuantity <= 0) break;

          // Quantidade a retirar deste lote
          const quantityFromBatch = Math.min(remainingQuantity, batch.currentQuantity);

          // Criar ligação Sale -> Batch
          await tx.saleItemBatch.create({
            data: {
              saleItemId: saleItem.id,
              batchId: batch.id,
              quantity: quantityFromBatch
            }
          });

          // Atualizar a quantidade disponível no lote
          await tx.batch.update({
            where: { id: batch.id },
            data: {
              currentQuantity: {
                decrement: quantityFromBatch
              }
            }
          });

          remainingQuantity -= quantityFromBatch;
        }

        // Atualizar o estoque total do produto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return newSale;
    });

    return sale;
  }

  // === 2. CANCELAR VENDA (Estorno) ===
  async cancelSale(saleId: string) {
    
    // Verificar se a venda existe e ainda está ativa
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            saleItemBatches: true
          }
        }
      }
    });

    if (!sale) {
      throw new Error('Venda não encontrada.');
    }

    if (sale.status === 'CANCELLED') {
      throw new Error('Esta venda já foi cancelada. Não é possível cancelar novamente.');
    }

    // Executar estorno em transação
    await prisma.$transaction(async (tx) => {
      
      // Processar cada item da venda
      for (const saleItem of sale.saleItems) {
        
        // Devolver as quantidades para cada lote
        for (const saleItemBatch of saleItem.saleItemBatches) {
          await tx.batch.update({
            where: { id: saleItemBatch.batchId },
            data: {
              currentQuantity: {
                increment: saleItemBatch.quantity
              }
            }
          });
        }

        // Devolver ao estoque global do produto
        await tx.product.update({
          where: { id: saleItem.productId },
          data: {
            stockQuantity: {
              increment: saleItem.quantity
            }
          }
        });
      }

      // Marcar a venda como cancelada
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      });
    });

    return { message: 'Venda cancelada com sucesso.' };
  }

  // === 3. LISTAR VENDAS COM TRANSFORMAÇÃO DE DADOS ===
  async listSales(): Promise<SaleResponse[]> {
    const sales = await prisma.sale.findMany({
      include: {
        saleItems: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformar _count em itemCount
    return sales.map((sale) => ({
      id: sale.id,
      userId: sale.userId,
      userName: sale.userName,
      totalValue: sale.totalValue,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      itemCount: sale.saleItems.length,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt
    }));
  }

  // === 4. BUSCAR VENDA POR ID ===
  async findSaleById(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            saleItemBatches: {
              include: {
                batch: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      throw new Error('Venda não encontrada.');
    }

    // Transformar resultado
    return {
      ...sale,
      itemCount: sale.saleItems.length
    };
  }

  // === 5. LISTAR VENDAS DE UM VENDEDOR ESPECÍFICO ===
  async listSalesByVendor(userId: string): Promise<SaleResponse[]> {
    const sales = await prisma.sale.findMany({
      where: { userId },
      include: {
        saleItems: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sales.map((sale) => ({
      id: sale.id,
      userId: sale.userId,
      userName: sale.userName,
      totalValue: sale.totalValue,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      itemCount: sale.saleItems.length,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt
    }));
  }

  // === MÉTODO AUXILIAR: Agrupar itens duplicados ===
  private groupDuplicateItems(items: CreateSaleItemInput[]): CreateSaleItemInput[] {
    const grouped = new Map<string, number>();

    items.forEach((item) => {
      const currentQuantity = grouped.get(item.productId) || 0;
      grouped.set(item.productId, currentQuantity + item.quantity);
    });

    return Array.from(grouped.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));
  }
}
