export const utilsDocs = {
  '/utils/unit-of-measures': {
    // * LISTA AS UNIDADES DE MEDIDA
    get: {
      summary: 'Lista todas as unidades de medida disponíveis',
      tags: ['Utilidades'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de unidades de medida recuperada com sucesso',
          content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            key: { type: 'string', example: 'KG' },
                            label: { type: 'string', example: 'KG' },
                        },
                    },
                },
            },
          },
        },
        401: { description: 'Não autorizado' },
      },
    },
  },
};