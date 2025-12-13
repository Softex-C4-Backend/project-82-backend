import swaggerJsdoc from 'swagger-jsdoc';
import { authDocs } from './authDocs'; 
import { usersDocs } from './usersDocs';
import { categoryDocs } from './categoryDocs';
import { supplierDocs } from './supplierDocs';
import { productDocs } from './productDocs';
import { utilsDocs } from './utilsDocs';

// IP público da sua VPS
// const PRODUCTION_IP = '100.48.50.166'; 

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project 82 API - Supermercado Cristo Rei - Teste',
      version: '1.0.0',
      description: 'Documentação da API de Gestão de Estoque',
    },
    // servers: [
    //   {
    //     url: `http://${PRODUCTION_IP}:3001`,
    //     description: 'Servidor de Produção (VPS)',
    //   },
    //   {
    //     url: 'http://localhost:3001',
    //     description: 'Servidor Local',
    //   },
    // ],
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
      ...utilsDocs,
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);