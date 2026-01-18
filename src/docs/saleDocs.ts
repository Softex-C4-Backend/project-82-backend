export const saleDocs = {
  '/sales': {
    // * CRIA NOVA VENDA
    post: {
      summary: 'Cria uma nova venda (PDV) - FEFO com controle de estoque',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items', 'paymentMethod'],
              properties: {
                items: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['productId', 'quantity'],
                    properties: {
                      productId: {
                        type: 'string',
                        format: 'uuid',
                        example: 'uuid-do-produto'
                      },
                      quantity: {
                        type: 'number',
                        example: 5,
                        description: 'Quantidade vendida. Aceita string ou number'
                      }
                    }
                  },
                  example: [
                    { productId: 'uuid-1', quantity: 3 },
                    { productId: 'uuid-2', quantity: 2 }
                  ]
                },
                paymentMethod: {
                  type: 'string',
                  enum: ['CASH', 'CARD', 'CHECK', 'PIX'],
                  example: 'CASH',
                  description: 'Método de pagamento utilizado'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Venda criada com sucesso. Estoque baixado automaticamente com FEFO.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Venda criada com sucesso.' },
                  sale: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      userId: { type: 'string', format: 'uuid', description: 'ID do vendedor' },
                      userName: { type: 'string', example: 'João Silva', description: 'Snapshot do nome do vendedor' },
                      totalValue: { type: 'number', format: 'float', example: 150.75 },
                      paymentMethod: { type: 'string', enum: ['CASH', 'CARD', 'CHECK', 'PIX'] },
                      status: { type: 'string', enum: ['COMPLETED', 'CANCELLED'], example: 'COMPLETED' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Dados inválidos ou erro de negócio (estoque insuficiente, produto indisponível, etc)'
        },
        401: {
          description: 'Não autorizado ou token não fornecido'
        },
        404: {
          description: 'Produto não encontrado'
        }
      }
    },
    // * LISTA VENDAS
    get: {
      summary: 'Lista todas as vendas ou apenas as do usuário logado',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'myOnly',
          required: false,
          schema: { type: 'string', enum: ['true', 'false'] },
          description: 'Se "true", retorna apenas as vendas do usuário logado. Se omitido ou "false", retorna todas as vendas.'
        }
      ],
      responses: {
        200: {
          description: 'Lista de vendas recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    userName: { type: 'string', example: 'João Silva' },
                    totalValue: { type: 'number', format: 'float' },
                    paymentMethod: { type: 'string', enum: ['CASH', 'CARD', 'CHECK', 'PIX'] },
                    status: { type: 'string', enum: ['COMPLETED', 'CANCELLED'] },
                    itemCount: { type: 'integer', example: 5, description: 'Quantidade de itens na venda' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' }
      }
    }
  },
  '/sales/{id}': {
    // * BUSCA VENDA POR ID
    get: {
      summary: 'Busca detalhes completos de uma venda',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Venda'
        }
      ],
      responses: {
        200: {
          description: 'Detalhes completos da venda com itens e rastreamento de lotes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                  userName: { type: 'string' },
                  totalValue: { type: 'number', format: 'float' },
                  paymentMethod: { type: 'string', enum: ['CASH', 'CARD', 'CHECK', 'PIX'] },
                  status: { type: 'string', enum: ['COMPLETED', 'CANCELLED'] },
                  itemCount: { type: 'integer' },
                  saleItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        saleId: { type: 'string', format: 'uuid' },
                        productId: { type: 'string', format: 'uuid' },
                        productName: { type: 'string', description: 'Snapshot do nome do produto' },
                        unitPrice: { type: 'number', format: 'float', description: 'Preço na hora da venda' },
                        quantity: { type: 'integer' },
                        saleItemBatches: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              quantity: { type: 'integer', description: 'Quantidade tirada deste lote' },
                              batch: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  code: { type: 'string', nullable: true },
                                  expirationDate: { type: 'string', format: 'date-time' }
                                }
                              }
                            }
                          },
                          description: 'Rastreamento dos lotes específicos usados neste item'
                        }
                      }
                    }
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' },
        404: { description: 'Venda não encontrada' }
      }
    }
  },
  '/sales/{id}/cancel': {
    // * CANCELAR VENDA
    post: {
      summary: 'Cancela uma venda e restaura o estoque (Apenas Manager)',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Venda a cancelar'
        }
      ],
      responses: {
        200: {
          description: 'Venda cancelada com sucesso. Estoque restaurado automaticamente.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Venda cancelada com sucesso.' }
                }
              }
            }
          }
        },
        400: {
          description: 'Venda já foi cancelada ou outro erro de negócio'
        },
        401: {
          description: 'Não autorizado'
        },
        403: {
          description: 'Acesso negado. Apenas managers podem cancelar vendas.'
        },
        404: {
          description: 'Venda não encontrada'
        },
        409: {
          description: 'Conflito: Venda já foi cancelada'
        }
      }
    }
  }
};
