export const authDocs = {
  '/auth/login': {
    post: {
      summary: 'Realiza o login do usuário',
      tags: ['Autenticação'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier', 'password'],
              properties: {
                identifier: {
                  type: 'string',
                  description: 'E-mail ou Matrícula',
                  example: 'a@a.com',
                },
                password: {
                  type: 'string',
                  description: 'Senha',
                  format: 'password',
                  example: '123456',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login realizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      role: { type: 'string', enum: ['MANAGER', 'EMPLOYEE'] },
                      status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Credenciais inválidas',
        },
      },
    },
  },
};