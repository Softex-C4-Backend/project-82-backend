import { prisma } from '../database/prisma';


export class DashboardService {
  // --- 1. PRODUTOS COM ESTOQUE BAIXO ---
  async getLowStockProducts() {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lte: prisma.product.fields.minStock
        }
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        minStock: true,
      },
      orderBy: {
        stockQuantity: 'asc' // Mostra primeiro o que está mais perto de acabar
      }
    });

    return lowStockProducts;
  }

  // --- 2. VALOR TOTAL EM ESTOQUE (FINANCEIRO) ---
  // Calcula quanto dinheiro o mercado tem "parado" em mercadoria (Custo x Quantidade)
  async getInventoryValue() {
    // Busca os produtos que possuem lotes com itens em estoque
    const productsWithStock = await prisma.product.findMany({
      where: {
        batches: {
          some: { currentQuantity: { gt: 0 } }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        batches: {
          where: { currentQuantity: { gt: 0 } },
          select: {
            currentQuantity: true,
            unitCost: true
          }
        }
      }
    });

    let globalTotalValue = 0;

    // Mapeia os dados para calcular o valor por produto e o total geral
    const details = productsWithStock.map(product => {
      // Soma o valor de todos os lotes deste produto (Quantidade Atual * Custo de Compra)
      const productValue = product.batches.reduce((sum, batch) => {
        return sum + (batch.currentQuantity * Number(batch.unitCost));
      }, 0);

      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
      
      globalTotalValue += productValue;

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        totalQuantity,
        inventoryValue: productValue
      };
    });

    // Ordena do produto mais caro para o mais barato em estoque
    details.sort((a, b) => b.inventoryValue - a.inventoryValue);

    return {
      totalInventoryValue: globalTotalValue,
      productCount: details.length,
      details
    };
  }
}