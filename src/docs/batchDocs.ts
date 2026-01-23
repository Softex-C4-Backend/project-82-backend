export const batchDocs = {
  '/batches': {
    // * LISTA LOTES
    get: {
      summary: 'Lista todos os lotes (Filtro opcional por produto)',
      tags: ['Lotes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'productId',
          required: false,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do produto para filtrar apenas os seus lotes',
        },
      ],
      responses: {
        200: {
          description: 'Lista de lotes recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    productId: { type: 'string', format: 'uuid' },
                    code: { type: 'string', nullable: true },
                    receivedDate: { type: 'string', format: 'date-time', nullable: true },
                    expirationDate: { type: 'string', format: 'date-time' },
                    initialQuantity: { type: 'integer' },
                    currentQuantity: { type: 'integer' },
                    unitCost: { type: 'number', format: 'float' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    product: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        unitOfMeasure: { type: 'string' },
                        stockQuantity: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        404: { description: 'Produto não encontrado (caso productId seja informado e não exista)' },
      },
    },
    // * CRIA NOVO LOTE
    post: {
      summary: 'Registra a entrada de um novo lote (Apenas Manager)',
      tags: ['Lotes'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'expirationDate', 'initialQuantity', 'unitCost'],
              properties: {
                productId: { type: 'string', format: 'uuid', example: 'uuid-do-produto' },
                code: { type: 'string', example: 'LOT2023-A1', nullable: true },
                receivedDate: { type: 'string', format: 'date-time', example: '2023-10-27T10:00:00.000Z', nullable: true },
                expirationDate: { type: 'string', format: 'date-time', example: '2024-10-27T23:59:59.000Z' },
                initialQuantity: { type: 'integer', example: 100 },
                unitCost: { type: 'number', example: 12.50 },
              },
            },
          },
        },
      },
      responses: {
        201: { 
          description: 'Lote criado com sucesso e estoque do produto atualizado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  productId: { type: 'string' },
                  initialQuantity: { type: 'integer' },
                  currentQuantity: { type: 'integer' },
                  unitCost: { type: 'number' },
                  expirationDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        400: { description: 'Dados inválidos ou erro na entrada de estoque' },
        403: { description: 'Acesso negado' },
        404: { description: 'Produto não encontrado' },
      },
    },
  },

  // * LISTA LOTES PRÓXIMOS AO VENCIMENTO
  '/batches/expiring': {
    get: {
      summary: 'Lista lotes próximos ao vencimento',
      description: 'Retorna todos os lotes que possuem estoque e cuja data de validade está dentro do intervalo de dias informado (padrão 30 dias).',
      tags: ['Lotes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'days',
          required: false,
          schema: { type: 'integer', default: 30 },
          description: 'Quantidade de dias para o filtro de vencimento',
        },
      ],
      responses: {
        200: {
          description: 'Lista de lotes próximos ao vencimento recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    batchNumber: { type: 'string', nullable: true },
                    expirationDate: { type: 'string', format: 'date-time' },
                    currentQuantity: { type: 'integer' },
                    productId: { type: 'string', format: 'uuid' },
                    productName: { type: 'string' },
                    productCode: { type: 'string' },
                    unitOfMeasure: { type: 'string' },
                    daysUntilExpiration: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Não autorizado' },
        500: { description: 'Erro ao buscar lotes vencendo' }
      }
    }
  },

  '/batches/{id}': {
    // * BUSCA LOTE POR ID
    get: {
      summary: 'Busca detalhes de um lote específico',
      tags: ['Lotes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do Lote',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes do lote e do produto vinculado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  productId: { type: 'string' },
                  code: { type: 'string', nullable: true },
                  receivedDate: { type: 'string', format: 'date-time', nullable: true },
                  expirationDate: { type: 'string', format: 'date-time' },
                  initialQuantity: { type: 'integer' },
                  currentQuantity: { type: 'integer' },
                  unitCost: { type: 'number' },
                  product: { type: 'object' },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        404: { description: 'Lote não encontrado' },
      },
    },
    // * ATUALIZA LOTE (PUT)
    put: {
      summary: 'Atualiza dados do lote (Apenas Manager)',
      tags: ['Lotes'],
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [],
              properties: {
                code: { type: 'string', example: 'NOVO-CODIGO', nullable: true },
                receivedDate: { type: 'string', format: 'date-time', nullable: true },
                expirationDate: { type: 'string', format: 'date-time', nullable: true },
                unitCost: { type: 'number', example: 13.00 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Lote atualizado com sucesso' },
        400: { description: 'Dados inválidos (Quantidade inicial e Produto não podem ser alterados)' },
        403: { description: 'Acesso negado' },
        404: { description: 'Lote não encontrado' },
      },
    },
    // * REMOVE LOTE
    delete: {
      summary: 'Remove um lote (Apenas Manager)',
      description: 'Atenção: Só é possível remover lotes que não tiveram nenhuma venda ou movimentação.',
      tags: ['Lotes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        200: { description: 'Lote removido e saldo de estoque do produto decrementado' },
        400: { description: 'Não é possível deletar um lote que já teve movimentação' },
        403: { description: 'Acesso negado' },
        404: { description: 'Lote não encontrado' },
      },
    },
  },
};