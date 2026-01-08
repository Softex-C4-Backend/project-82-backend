export const usersDocs = {
  '/users/me': {
    // * BUSCA O PERFIL DO USUÁRIO LOGADO
    get: {
      summary: 'Busca o perfil do usuário logado',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Perfil recuperado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid'},
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email'},
                  registration: { type: 'string' },
                  role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                  status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        404: { description: 'Usuário não encontrado'},
      },
    },

    // * ATUALIZA O PRÓPRIO PERFIL DO USUÁRIO LOGADO
    put: {
      summary: 'Atualiza o próprio perfil do usuário logado',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Meu Novo Nome' },
                email: { type: 'string', format: 'email', example: 'novo@email.com' },
              },
            },
          },
        },
      },
      responses: {
        200: { 
          description: 'Perfil atualizado com sucesso', 
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid'},
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email'},
                  registration: { type: 'string' },
                  role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                  status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        400: { description: 'Dados inválidos' },
        401: { description: 'Usuário não autenticado' },
        409: { description: 'E-mail já em uso' },
      },
    },
  },

  '/users': {
    // * CRIA UM NOVO USUÁRIO (Apenas Manager)
    post: {
      summary: 'Cria um novo usuário (Apenas Manager)',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'registration'],
              properties: {
                name: { type: 'string', example: 'Funcionário 1'},
                email: {type: 'string',format: 'email', example: 'fun@email.com'},
                registration: { type: 'string', example: 'MAT-01' },
                role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'], example: 'EMPLOYEE' },
              }
            },
          },
        },
      },
      responses: {
        201: { 
          description: 'Usuário criado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      registration: { type: 'string' },
                      role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                      status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  temporaryPassword: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Dados inválidos ou e-mail/matrícula duplicados' },
        403: { description: 'Acesso negado (Não é Manager)' },
      },
    },

    // * LISTA TODOS OS USUÁRIOS (Apenas Manager)
    get: {
      summary: 'Lista todos os usuários (Apenas Manager)',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de usuários recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    registration: { type: 'string' },
                    role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                    status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        403: { description: 'Acesso negado (Não é Manager)' },
      },
    },
  },

  '/users/search': {
    // * BUSCA USUÁRIOS POR NOME, E-MAIL OU MATRÍCULA (Apenas Manager)
    get: {
      summary: 'Busca usuários por nome, e-mail ou matrícula (Apenas Manager)',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Termo de busca para nome, e-mail ou matrícula',
        },
      ],
      responses: {
        200: {
          description: 'Lista de usuários que correspondem à busca',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    registration: { type: 'string' },
                    role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                    status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        400: { description: 'Parâmetro de busca inválido' },
        403: { description: 'Acesso negado (Não é Manager)'},
      },
    },
  },

  '/users/{id}': {
    // * BUSCA USUÁRIO POR ID (Apenas Manager)
    get: {
      summary: 'Busca um usuário pelo ID (Apenas Manager)',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do usuário',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes do usuário recuperados',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  registration: { type: 'string' },
                  role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                  status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        403: { description: 'Acesso negado (Não é Manager)' },
        404: { description: 'Usuário não encontrado' },
      },

    },

    // * REMOVE USUÁRIO POR ID (Apenas Manager)
    delete: {
      summary: 'Remove um usuário por ID (Apenas Manager)',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do usuário a ser removido',
        },
      ],
      responses: {
        200: { description: 'Usuário removido com sucesso' },
        403: { description: 'Acesso negado (Não é Manager)' },
        404: { description: 'Usuário não encontrado' },
      },
    },
  },
  
  // * ALTERA A SENHA DO USUÁRIO LOGADO
  '/users/change-password': {
    post: {
      summary: 'Altera a senha do usuário logado',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newPassword'],
              properties: {
                newPassword: { type: 'string', format: 'password', minLength: 6, example: 'novaSenha123' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Senha alterada com sucesso' },
        401: { description: 'Usuário não autenticado' },
      },
    },
  },

};