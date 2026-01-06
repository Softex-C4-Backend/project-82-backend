export const supplierDocs = {
  '/suppliers': {
    // * LISTA TODOS OS FORNECEDORES
    get: {
      summary: 'Lista todos os fornecedores',
      tags: ['Fornecedores'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de fornecedores recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    cnpj: { type: 'string' },
                    contactEmail: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zipCode: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    productsCount: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Não autorizado' },
      },
    },
    // * CRIA NOVO FORNECEDOR
    post: {
      summary: 'Cria novo fornecedor (Apenas Manager)',
      tags: ['Fornecedores'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Distribuidora Aliança' },
                cnpj: { type: 'string', example: '12345678000199' },
                contactEmail: { type: 'string', format: 'email', example: 'contato@alianca.com' },
                phone: { type: 'string', example: '91988887777' },
                street: { type: 'string', example: 'Rua das Flores, 123' },
                city: { type: 'string', example: 'Belém' },
                state: { type: 'string', example: 'PA' },
                zipCode: { type: 'string', example: '66000000' },
              },
            },
          },
        },
      },
      responses: {
        201: { 
          description: 'Fornecedor criado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  cnpj: { type: 'string' },
                  contactEmail: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          }, 
        },
        400: { description: 'Nome duplicado ou CNPJ inválido' },
        403: { description: 'Acesso negado' },
      },
    },
  },
  '/suppliers/{id}': {
    // * BUSCA FORNECEDOR POR ID
    get: {
      summary: 'Busca fornecedor por ID',
      tags: ['Fornecedores'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do fornecedor',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes do fornecedor e seus produtos',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  cnpj: { type: 'string' },
                  contactEmail: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: { description: 'Fornecedor não encontrado'},
        401: { description: 'Não autorizado'},
      },
    },
    // * EDITA FORNECEDOR
    put: {
      summary: 'Edita fornecedor (Apenas Manager)',
      tags: ['Fornecedores'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do fornecedor',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                cnpj: { type: 'string' },
                contactEmail: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { 
          description: 'Fornecedor atualizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  cnpj: { type: 'string' },
                  contactEmail: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          }, 
        },
        400: { description: 'Nome ou CNPJ duplicado' },
        401: { description: 'Não autorizado' },
        403: { description: 'Acesso negado' },
        404: { description: 'Fornecedor não encontrado' },
      },
    },
    // * REMOVE FORNECEDOR
    delete: {
      summary: 'Remove fornecedor (Apenas Manager)',
      tags: ['Fornecedores'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do fornecedor',
        },
      ],
      responses: {
        200: { description: 'Fornecedor removido com sucesso' },
        400: { description: 'Não pode remover se houver produtos vinculados' },
        401: { description: 'Não autorizado'},
        403: { description: 'Acesso negado'},
        404: { description: 'Fornecedor não encontrado'},
      },
    },
  },
};