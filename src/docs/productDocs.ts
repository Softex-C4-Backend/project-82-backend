export const productDocs = {
  '/products': {
    // * LISTA TODOS OS PRODUTOS
    get: {
      summary: 'Lista todos os produtos',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de produtos recuperada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number', format: 'float' },
                    promotionalPrice: { 
                      type: 'number', 
                      format: 'float', 
                      nullable: true, 
                      description: 'Preço calculado caso haja uma promoção ativa' 
                    },
                    activePromotion: {
                      type: 'object',
                      nullable: true,
                      description: 'Detalhes da promoção vigente no momento',
                      properties: {
                        name: { type: 'string' },
                        discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                        discountValue: { type: 'number' }
                      }
                    },
                    cost: { type: 'number', format: 'float' },
                    stockQuantity: { type: 'integer'},
                    minStock: { type: 'integer' },
                    unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'] },
                    categoryId: { type: 'string', format: 'uuid' },
                    supplierId: { type: 'string', format: 'uuid' },
                    isAvailable: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    category: { 
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      }
                    },
                    supplier: { 
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
    // * CRIA NOVO PRODUTO
    post: {
      summary: 'Cria um novo produto (Apenas Manager)',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'code', 'price', 'unitOfMeasure', 'categoryId'],
              properties: {
                name: { type: 'string', example: 'Arroz Branco 5kg' },
                code: { type: 'string', example: '7891234567890' },
                description: { type: 'string', example: 'Pacote de arroz tipo 1' },
                price: { type: 'number', example: 25.90 },
                minStock: { type: 'integer', example: 10 },
                unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'], example: 'KG' },
                categoryId: { type: 'string', format: 'uuid', example: 'uuid-da-categoria' },
                supplierId: { type: 'string', format: 'uuid', example: 'uuid-do-fornecedor' },
              },
            },
          },
        },
      },
      responses: {
        201: { 
          description: 'Produto criado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number', format: 'float' },
                  cost: { type: 'number', format: 'float' },
                  stockQuantity: { type: 'integer'},
                  minStock: { type: 'integer' },
                  unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  supplierId: { type: 'string', format: 'uuid' },
                  isAvailable: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        400: { description: 'Dados inválidos ou código de barras duplicado' },
        403: { description: 'Acesso negado' },
        404: { description: 'Categoria ou fornecedor não encontrado'},
      },
    },
  },
  '/products/{id}': {
    // * BUSCA PRODUTO POR ID
    get: {
      summary: 'Busca um produto pelo ID',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do Produto',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes do produto',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number', format: 'float' },
                  promotionalPrice: { 
                    type: 'number', 
                    format: 'float', 
                    nullable: true, 
                    description: 'Preço calculado caso haja uma promoção ativa' 
                  },
                  activePromotion: {
                    type: 'object',
                    nullable: true,
                    description: 'Detalhes da promoção vigente no momento',
                    properties: {
                      name: { type: 'string' },
                      discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                      discountValue: { type: 'number' }
                    }
                  },
                  cost: { type: 'number', format: 'float' },
                  stockQuantity: { type: 'integer'},
                  minStock: { type: 'integer' },
                  unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  supplierId: { type: 'string', format: 'uuid' },
                  isAvailable: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  supplier: {
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
          },
        },
        401: { description: 'Não autorizado' },
        404: { description: 'Produto não encontrado' },
      },
    },
    // * ATUALIZA PRODUTO
    put: {
      summary: 'Atualiza um produto (Apenas Manager)',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do Produto',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Novo nome' },
                code: { type: 'string', example: '7891234567890' },
                description: { type: 'string', example: 'Nova descrição' },
                price: { type: 'number', example: 30.00 },
                minStock: { type: 'integer', example: 5 },
                unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'], example: 'UNIT' },
                categoryId: { type: 'string', format: 'uuid', example: 'uuid-da-nova-categoria' },
                supplierId: { type: 'string', format: 'uuid', example: 'uuid-do-novo-fornecedor' },
                isAvailable: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        200: { 
          description: 'Produto atualizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number', format: 'float' },
                  cost: { type: 'number', format: 'float' },
                  stockQuantity: { type: 'integer'},
                  minStock: { type: 'integer' },
                  unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  supplierId: { type: 'string', format: 'uuid' },
                  isAvailable: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  supplier: {
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
          }, 
        },
        400: { description: 'Dados inválidos ou código de barras duplicado' },
        403: { description: 'Acesso negado' },
        404: { description: 'Produto, categoria ou fornecedor não encontrado'},
      },
    },
    // * REMOVE PRODUTO
    delete: {
      summary: 'Remove um produto (Apenas Manager)',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID do Produto',
        },
      ],
      responses: {
        200: { description: 'Produto removido com sucesso' },
        400: { description: 'Não pode remover produto que está vinculado a pedidos' },
        403: { description: 'Acesso negado' },
        404: { description: 'Produto não encontrado' },
      },
    },
  },
  '/products/code/{code}':{
    // * BUSCA PRODUTO POR CODE PARA O PDV
    get: {
      summary: 'Busca um produto pelo código (code) - Para PDV',
      description: 'Busca um produto pelo código de barras (code). Usado principalmente no PDV para agilizar a venda.',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'code',
          required: true,
          schema: { type: 'string' },
          description: 'CÓDIGO de barras do Produto',
        },
      ],
      responses: {
        200: {
          description: 'Detalhes do produto',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number', format: 'float' },
                  promotionalPrice: { 
                    type: 'number', 
                    format: 'float', 
                    nullable: true, 
                    description: 'Preço calculado caso haja uma promoção ativa' 
                  },
                  activePromotion: {
                    type: 'object',
                    nullable: true,
                    description: 'Detalhes da promoção vigente no momento',
                    properties: {
                      name: { type: 'string' },
                      discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                      discountValue: { type: 'number' }
                    }
                  },
                  cost: { type: 'number', format: 'float' },
                  stockQuantity: { type: 'integer'},
                  minStock: { type: 'integer' },
                  unitOfMeasure: { type: 'string', enum: ['UNIT', 'KG', 'LITER'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  supplierId: { type: 'string', format: 'uuid' },
                  isAvailable: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  supplier: {
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
          },
        },
        400: { description: 'Código inválido' },
        401: { description: 'Não autorizado' },
        404: { description: 'Produto não encontrado' },
      },
    }
  },

  // * BUSCA INTELIGENTE DE PRODUTOS (NOME OU CÓDIGO)
  '/products/search': {
    get: {
      summary: 'Busca inteligente de produtos (Nome ou Código)',
      description: 'Pesquisa produtos pelo nome (parcial) ou pelo código (exato). Se o código for encontrado, retorna apenas esse produto numa lista. Caso contrário, procura por nomes que contenham o termo.',
      tags: ['Produtos'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'q',
          required: true,
          schema: { type: 'string' },
          description: 'Termo de pesquisa (nome parcial ou código exato do produto)',
        },
      ],
      responses: {
        200: {
          description: 'Pesquisa realizada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    price: { type: 'number' },
                    promotionalPrice: { 
                      type: 'number', 
                      format: 'float', 
                      nullable: true, 
                      description: 'Preço calculado caso haja uma promoção ativa' 
                    },
                    activePromotion: {
                      type: 'object',
                      nullable: true,
                      description: 'Detalhes da promoção vigente no momento',
                      properties: {
                        name: { type: 'string' },
                        discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_VALUE'] },
                        discountValue: { type: 'number' }
                      }
                    },
                    stockQuantity: { type: 'integer' },
                    minStock: { type: 'integer' },
                    unitOfMeasure: { type: 'string' },
                    category: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Termo de pesquisa não informado' },
        401: { description: 'Não autorizado' },
        500: { description: 'Erro ao realizar a pesquisa' }
      }
    }
  },
};