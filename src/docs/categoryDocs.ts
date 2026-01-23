export const categoryDocs = {
  '/categories': {
    // * LISTA TODAS AS CATEGORIAS
    get: {
      summary: 'Lista todas as categorias',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista recuperada com sucesso',
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
                    createdAt: { type: 'string', format: 'date-time' }, // Formatado para data
                    updatedAt: { type: 'string', format: 'date-time' }, // Formatado para data
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
      },
    },
    // * CRIA UMA NOVA CATEGORIA
    post: {
      summary: 'Cria uma nova categoria (Apenas Manager)',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Bebidas' },
                description: { type: 'string', example: 'Sucos, refrigerantes e água' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Categoria criada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }, // Formatado para data
                  updatedAt: { type: 'string', format: 'date-time' }, // Formatado para data
                },
              },
            },
          },
        },
        // 201: { description: 'Categoria criada com sucesso' },
        400: { description: 'Nome obrigatório ou duplicado' },
        403: { description: 'Acesso negado' },
      },
    },
  },

  '/categories/search': {
    get: {
      summary: 'Buscar categorias por nome',
      description: 'Retorna uma lista de categorias cujo nome contenha o termo pesquisado.',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'q',
          required: true,
          schema: { type: 'string' },
          description: 'Termo de busca'
        }
      ],
      responses: {
        200: {
          description: 'Busca realizada com sucesso',
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
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        400: { description: 'Termo não informado' },
        401: { description: 'Não autorizado' }
      }
    }
  },

  '/categories/{id}': {
    // * BUSCA CATEGORIA POR ID
    get: {
      summary: 'Busca categoria por ID',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Categoria',
        },
      ],
      responses: {
        200: { 
          description: 'Detalhes da categoria',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado'},
        404: { description: 'Categoria não encontrada' },
      },
    },
    // * EDITA UMA CATEGORIA
    put: {
      summary: 'Edita uma categoria (Apenas Manager)',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Categoria',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Bebidas Editada' },
                description: { type: 'string', example: 'Nova descrição' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Categoria atualizada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }, // Formatado para data
                  updatedAt: { type: 'string', format: 'date-time' }, // Formatado para data
                },
              },
            },
          },
        },
        400: { description: 'Nome obrigatório ou duplicado'},
        403: { description: 'Acesso negado'},
        404: { description: 'Categoria não encontrada' },
      },
    },
    // * REMOVE UMA CATEGORIA
    delete: {
      summary: 'Remove uma categoria (Apenas Manager)',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID da Categoria',
        },
      ],
      responses: {
        200: { description: 'Removido com sucesso' },
        400: { description: 'Não pode remover categoria que possui produtos vinculados' },
        403: { description: 'Acesso negado' },
        404: { description: 'Categoria não encontrada' },
      },
    },
  },
};