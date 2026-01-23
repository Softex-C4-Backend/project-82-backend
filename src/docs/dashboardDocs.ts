export const dashboardDocs = {
  // * RETORNAR PRODUTOS COM ESTOQUE BAIXO
  '/dashboard/low-stock': {
    get: {
      summary: 'Lista produtos com estoque baixo ou zerado',
      description: 'Retorna todos os produtos onde a quantidade em estoque é menor ou igual ao estoque mínimo definido.',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de produtos em alerta recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    stockQuantity: { type: 'integer', example: 5 },
                    minStock: { type: 'integer', example: 10 }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' },
        500: { description: 'Erro interno ao processar os dados do dashboard' }
      }
    }
  },

  // * RETORNAR PRODUTOS COM ESTOQUE ZERADO
  '/dashboard/out-of-stock': {
    get: {
      summary: 'Lista produtos com estoque zerado (Ruptura)',
      description: 'Retorna produtos que estão marcados como disponíveis (isAvailable: true) mas que possuem quantidade em estoque igual a zero.',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de produtos em falta recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    category: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' },
        500: { description: 'Erro ao buscar produtos em falta' }
      }
    }
  },

  // * CALCULAR VALOR TOTAL FINANCEIRO EM ESTOQUE
  '/dashboard/inventory-value': {
    get: {
      summary: 'Calcula o valor total financeiro em estoque',
      description: 'Soma o custo de aquisição (unitCost) de todos os lotes que possuem saldo (currentQuantity > 0). Retorna o total e o detalhamento por produto.',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Cálculo financeiro realizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalInventoryValue: { type: 'number', example: 15450.50 },
                  productCount: { type: 'integer', example: 12 },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        totalQuantity: { type: 'integer' },
                        inventoryValue: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' },
        403: { description: 'Acesso negado (Apenas Manager)' },
        500: { description: 'Erro ao calcular valor do estoque' }
      }
    }
  },

  // * EVOLUÇÃO DE VENDAS (GRÁFICO)
  '/dashboard/sales-evolution': {
    get: {
      summary: 'Evolução de vendas por período (Gráfico)',
      description: 'Retorna o faturamento total e a quantidade de vendas agrupados por dia. Útil para gráficos de tendência.',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'days',
          schema: { type: 'integer', default: 7 },
          description: 'Número de dias para análise retroativa (ex: 7, 15, 30)',
        },
      ],
      responses: {
        200: {
          description: 'Dados de evolução recuperados com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', example: '2023-10-25' },
                    totalValue: { type: 'number', example: 1500.50 },
                    saleCount: { type: 'integer', example: 15 },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        403: { description: 'Acesso negado (Apenas Manager)' },
        500: { description: 'Erro ao buscar dados de evolução' },
      },
    },
  },

  // * PERDAS POR CATEGORIA (LOTES VENCIDOS)
  '/dashboard/losses-by-category': {
    get: {
      summary: 'Perdas financeiras por categoria (Lotes Vencidos)',
      description: 'Retorna o prejuízo total acumulado por lotes vencidos que ainda possuem estoque físico, agrupado por categoria.',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'days',
          schema: { type: 'integer', default: 30 },
          description: 'Dias retroativos para análise (ex: 30 para o último mês)',
        },
      ],
      responses: {
        200: {
          description: 'Relatório de perdas recuperado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    categoryName: { type: 'string', example: 'Hortifruti' },
                    totalLossValue: { type: 'number', example: 150.50 },
                    expiredItemCount: { type: 'integer', example: 45 },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        403: { description: 'Acesso negado (Apenas Manager)' },
        500: { description: 'Erro ao buscar perdas' },
      },
    },
  }
};