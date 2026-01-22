export const dashboardDocs = {
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
  }
};