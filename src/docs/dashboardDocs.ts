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
  }
};