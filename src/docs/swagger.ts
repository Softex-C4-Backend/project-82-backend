import swaggerJsdoc from 'swagger-jsdoc';
import { authDocs } from './authDocs'; 
import { usersDocs } from './usersDocs';
import { categoryDocs } from './categoryDocs';
import { supplierDocs } from './supplierDocs';
import { productDocs } from './productDocs';
import { batchDocs } from './batchDocs';
import { utilsDocs } from './utilsDocs';
import { saleDocs } from './saleDocs';
import { promotionDocs } from './promotionDocs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project 82 API - Supermercado Cristo Rei',
      version: '1.0.0',
      description: 'Documentação da API de Gestão de Estoque',
    },
    // Configuração de Segurança (Para o botão Authorize funcionar com JWT)
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // 'paths' define as rotas/endpoints da API
    paths: {
      ...authDocs,
      ...usersDocs,
      ...categoryDocs,
      ...supplierDocs,
      ...productDocs,
      ...batchDocs,
      ...saleDocs,
      ...utilsDocs,
      ...promotionDocs,
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);