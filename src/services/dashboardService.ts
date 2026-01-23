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

  // --- 3. PRODUTOS EM FALTA (RUPTURA) ---
  // Retorna produtos que estão ativos no sistema (isAvailable: true) mas que o estoque zerou.
  async getOutOfStockProducts() {
    return await prisma.product.findMany({
      where: {
        stockQuantity: 0,
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  // --- 4. EVOLUÇÃO DE VENDAS (ÚLTIMOS X DIAS) ---
  // Retorna o faturamento diário para alimentar o gráfico
  async getSalesEvolution(days: number = 7) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (days - 1)); // Define o início do intervalo
    startDate.setHours(0, 0, 0, 0); // Zera o horário para pegar o dia todo

    // Busca as vendas na tabela Sale
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startDate }, // Vendas a partir da data de início
        status: 'COMPLETED'            // Importante: ignorar vendas canceladas
      },
      select: {
        createdAt: true,
        totalValue: true,
      }
    });

    const evolution = [];

    // Loop para garantir que todos os dias do intervalo apareçam (mesmo com valor 0)
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

      // Filtra as vendas que ocorreram especificamente nesta data do loop
      const daySales = sales.filter(sale => 
        sale.createdAt.toISOString().split('T')[0] === dateStr
      );

      // Soma o total vendido no dia
      const totalValue = daySales.reduce((acc, curr) => acc + Number(curr.totalValue), 0);

      evolution.push({
        date: dateStr,
        totalValue,
        saleCount: daySales.length
      });
    }

    return evolution;
  }
}