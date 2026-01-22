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
}