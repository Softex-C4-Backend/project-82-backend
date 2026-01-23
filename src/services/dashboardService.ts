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

  // --- 6. PERDAS POR CATEGORIA (LOTES VENCIDOS RECENTEMENTE) ---
  // Calcula o prejuízo financeiro de itens vencidos, agrupado por categoria.
  async getLossesByCategory(days: number = 30) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days); // Define o limite retroativo (ex: 30 dias atrás)

    // 1. Busca lotes que ainda têm saldo físico MAS já venceram nesse período
    const expiredBatches = await prisma.batch.findMany({
      where: {
        currentQuantity: { gt: 0 }, // O item está lá ocupando espaço
        expirationDate: {
          lt: today,      // Já venceu (Data de validade < Hoje)
          gte: startDate  // Venceu recentemente (Data de validade >= Data de Corte)
        }
      },
      include: {
        product: {
          select: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // 2. Agrupa os valores por Categoria
    const lossesMap = new Map<string, { id: string, name: string, total: number, count: number }>();

    for (const batch of expiredBatches) {
      const categoryId = batch.product.category.id;
      const categoryName = batch.product.category.name;
      
      // Calcula o prejuízo deste lote específico
      const lossValue = batch.currentQuantity * Number(batch.unitCost);

      if (!lossesMap.has(categoryId)) {
        lossesMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          total: 0,
          count: 0
        });
      }

      const current = lossesMap.get(categoryId)!;
      current.total += lossValue;           // Soma financeiro
      current.count += batch.currentQuantity; // Soma quantidade física
    }

    // 3. Formata para lista e ordena pelo maior prejuízo
    const result = Array.from(lossesMap.values()).map(item => ({
      categoryId: item.id,
      categoryName: item.name,
      totalLossValue: item.total,
      expiredItemCount: item.count
    }));

    return result.sort((a, b) => b.totalLossValue - a.totalLossValue);
  }

  // --- 7. PRODUTOS MAIS VENDIDOS (RANKING) ---
  // Retorna os produtos mais vendidos em um período, limitado a X itens
  async getBestSellers(days: number = 30, limit: number = 5) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    // 1. Agrupa os itens vendidos, soma quantidades e valores
    const ranking = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true,
        subTotal: true
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: limit
    });

    // 2. Busca os detalhes (Nome e Estoque Atual) dos produtos retornados
    // O groupBy não permite 'include', então precisamos buscar os nomes separadamente
    const enrichedRanking = await Promise.all(ranking.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          name: true,
          code: true,
          stockQuantity: true, // Estoque atual para comparar com o volume de vendas
          unitOfMeasure: true
        }
      });

      return {
        productId: item.productId,
        productName: product?.name || 'Produto Removido',
        productCode: product?.code,
        unitOfMeasure: product?.unitOfMeasure,
        totalSold: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.subTotal) || 0,
        currentStock: product?.stockQuantity || 0
      };
    }));

    return enrichedRanking;
  }

  // --- 8. PRODUTOS MENOS VENDIDOS (INCLUINDO ZERO VENDAS) ---
  async getLeastSoldProducts(days: number = 30, limit: number = 5) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    // 1. Busca o volume de vendas apenas do período selecionado
    const salesStats = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true,
        subTotal: true
      }
    });

    // 2. Busca TODOS os produtos ativos para encontrar os que NÃO venderam
    const allProducts = await prisma.product.findMany({
      where: { isAvailable: true }, // Ignora produtos inativos/excluídos
      select: {
        id: true,
        name: true,
        code: true,
        stockQuantity: true,
        unitOfMeasure: true
      }
    });

    // 3. Cruza as listas: Se o produto não tem venda registrada, assume 0
    const ranking = allProducts.map(product => {
      const stat = salesStats.find(s => s.productId === product.id);

      return {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        unitOfMeasure: product.unitOfMeasure,
        totalSold: stat?._sum.quantity || 0,        // Aqui está o segredo do Zero
        totalRevenue: Number(stat?._sum.subTotal) || 0,
        currentStock: product.stockQuantity
      };
    });

    // 4. Ordena Crescente (Menos vendidos primeiro) e corta no limite
    ranking.sort((a, b) => a.totalSold - b.totalSold);

    return ranking.slice(0, limit);
  }
}