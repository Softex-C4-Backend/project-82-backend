// src/docs/promotionDocs.ts
export const promotionDocs = {
  '/promotions': {
    get: {
      summary: 'Lista todas as promoções',
      tags: ['Promoções'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'productId',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filtrar por ID do produto',
        },
      ],
      responses: {
        200: {
          description: 'Lista de promoções recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                    discountValue: { type: 'number' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    isActive: { type: 'boolean' },
                    productId: { type: 'string', format: 'uuid' },
                    product: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
      },
    },
    post: {
      summary: 'Cria uma nova promoção (Apenas Manager)',
      tags: ['Promoções'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'discountType', 'discountValue', 'startDate', 'endDate', 'productId'],
              properties: {
                name: { type: 'string', example: 'Promoção de Verão' },
                description: { type: 'string', example: 'Desconto em produtos selecionados' },
                discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'], example: 'PERCENTAGE' },
                discountValue: { type: 'number', example: 15 },
                startDate: { type: 'string', format: 'date-time', example: '2026-01-15T00:00:00Z' },
                endDate: { type: 'string', format: 'date-time', example: '2026-01-30T23:59:59Z' },
                productId: { type: 'string', format: 'uuid', example: 'uuid-do-produto' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Promoção criada com sucesso' },
        400: { description: 'Dados inválidos' },
        403: { description: 'Acesso negado' },
      },
    },
  },
  '/promotions/notifications/expiring': {
    get: {
      summary: 'Busca notificações de produtos próximos ao vencimento (Apenas Manager)',
      tags: ['Promoções'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'days',
          schema: { type: 'integer', default: 7 },
          description: 'Número de dias para considerar próximo ao vencimento',
        },
      ],
      responses: {
        200: {
          description: 'Lista de notificações',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    message: { type: 'string' },
                    batchId: { type: 'string', format: 'uuid' },
                    productId: { type: 'string', format: 'uuid' },
                    expirationDate: { type: 'string', format: 'date-time' },
                    currentQuantity: { type: 'integer' },
                    suggestPromotion: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
        403: { description: 'Acesso negado' },
      },
    },
  },
  '/promotions/{id}': {
    get: {
      summary: 'Busca uma promoção pelo ID',
      tags: ['Promoções'],
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
        200: { description: 'Detalhes da promoção' },
        404: { description: 'Promoção não encontrada' },
      },
    },
    patch: {
      summary: 'Atualiza uma promoção (Apenas Manager)',
      tags: ['Promoções'],
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
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                discountValue: { type: 'number' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Promoção atualizada com sucesso' },
        403: { description: 'Acesso negado' },
        404: { description: 'Promoção não encontrada' },
      },
    },
    delete: {
      summary: 'Remove uma promoção (Apenas Manager)',
      tags: ['Promoções'],
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
        200: { description: 'Promoção removida com sucesso' },
        403: { description: 'Acesso negado' },
        404: { description: 'Promoção não encontrada' },
      },
    },
  },
};
