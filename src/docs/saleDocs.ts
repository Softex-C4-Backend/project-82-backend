export const saleDocs = {
  '/sales': {
    // * LISTA VENDAS
    get: {
      summary: 'Lista o histórico de vendas (Geral ou por Vendedor)',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'myOnly',
          required: false,
          schema: { type: 'string', enum: ['true', 'false'] },
          description: 'Se "true", retorna apenas as vendas do usuário logado.'
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
                    totalValue: { type: 'number' },
                    paymentMethod: { type: 'string', enum: ['CASH', 'CARD', 'PIX'] },
                    status: { type: 'string', enum: ['COMPLETED', 'CANCELED'] },
                    userName: { type: 'string', description: 'Nome do vendedor no momento da venda' },
                    createdAt: { type: 'string', format: 'date-time' },
                    itemCount: { 
                      type: 'integer', 
                      description: 'Quantidade total de itens diferentes nesta venda' 
                    },
                    user: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' }
                      }
                    }
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
      },
    },
    // * REGISTRA NOVA VENDA
    post: {
      summary: 'Registra uma nova venda (Baixa automática via FEFO)',
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
                paymentMethod: { 
                  type: 'string', 
                  enum: ['CASH', 'CARD', 'PIX'],
                  example: 'CARD' 
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['productId', 'quantity'],
                    properties: {
                      productId: { type: 'string', format: 'uuid', example: 'uuid-do-produto' },
                      quantity: { type: 'integer', example: 2 },
                    },
                  },
                  minItems: 1
                },
              },
            },
          },
        },
      },
      responses: {
        201: { 
          description: 'Venda realizada com sucesso e estoque atualizado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  totalValue: { type: 'number' },
                  status: { type: 'string' },
                  items: { type: 'array', items: { type: 'object' } }
                },
              },
            },
          },
        },
        400: { description: 'Dados inválidos ou erro na lógica de venda' },
        401: { description: 'Usuário não autenticado' },
        404: { description: 'Produto não encontrado, indisponível ou estoque insuficiente' },
      },
    },
  },
  '/sales/{id}': {
    // * DETALHES DA VENDA
    get: {
      summary: 'Busca detalhes completos de uma venda específica',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Venda',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes da venda, itens e lotes utilizados',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  totalValue: { type: 'number' },
                  paymentMethod: { type: 'string' },
                  status: { type: 'string' },
                  userName: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  user: { type: 'object' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productName: { type: 'string' },
                        quantity: { type: 'integer' },
                        unitPrice: { type: 'number' },
                        subTotal: { type: 'number' },
                        batches: { type: 'array', items: { type: 'object' } }
                      }
                    }
                  }
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        404: { description: 'Venda não encontrada' },
      },
    },
  },
  '/sales/{id}/cancel': {
    // * CANCELAR VENDA
    put: {
      summary: 'Cancela uma venda e estorna o estoque (Apenas Manager)',
      tags: ['Vendas'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: { 
                  type: 'string', 
                  minlength: 5, 
                  example: 'Erro na digitação do método de pagamento' 
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Venda cancelada e estoque estornado nos lotes originais' },
        400: { description: 'Motivo inválido ou venda já cancelada' },
        403: { description: 'Acesso negado (Apenas Manager pode cancelar)' },
        404: { description: 'Venda não encontrada' },
      },
    },
  },
};