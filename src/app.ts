import cors from 'cors';
import express from 'express';                          // 1. Importa o Express
import { prisma } from './database/prisma';             // 2. Importa o cliente Prisma  
import authRoutes from './routes/authRoutes';           // 3. Importa as rotas de autenticação
import testRoutes from './routes/testRoutes';           // 4. Importa as rotas de teste
import userRoutes from './routes/userRoutes';           // 5. Importa as rotas de usuário
import categoryRoutes from './routes/categoryRoutes';   // 6. Importa as rotas de categoria   
import utilRoutes from './routes/utilRoutes';           // 7. Importa as rotas de utilidades
import productRoutes from './routes/productRoutes';     // 8. Importa as rotas de Produto
import supplierRoutes from './routes/supplierRoutes';   // 9. Importa as rotas de Fornecedor
import batchRoutes from './routes/batchRoutes';         // 10. Importa as rotas de Lote
import promotionRoutes from './routes/promotionRoutes'; // 11. Importa as rotas de Promoção // Jose

// --- IMPORTS DO SWAGGER ---
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';


const app = express();

// Middleware: Habilita o CORS para permitir requisições de outras origens
app.use(cors());

// Middleware: Permite que o Express leia o corpo das requisições como JSON
app.use(express.json());

// --- ROTA DA DOCUMENTAÇÃO ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// --- ROTAS DE APLICAÇÃO ---
// Define o prefixo das rotas de Auth
// Todas as rotas de authRoutes começam com /auth  Ex: /auth/login
app.use('/auth', authRoutes);

// Configura as rotas de Teste
// Isso diz: "Tudo que começar com /test, mande para o arquivo testRoutes"
app.use('/test', testRoutes);

// Configura as rotas de Usuário
// Tudo que começar com /users, mande para userRoutes
app.use('/users', userRoutes);

// Configura as rotas de Categoria
// Tudo que começar com /categories, mande para categoryRoutes
app.use('/categories', categoryRoutes);

// Configura as rotas de Utilidades
// Tudo que começar com /utils, mande para utilRoutes
app.use('/utils', utilRoutes);

// Configura as rotas de Produto
// Tudo que começar com /products, mande para productRoutes
app.use('/products', productRoutes);

// Configura as rotas de Fornecedor
// Tudo que começar com /suppliers, mande para supplierRoutes
app.use('/suppliers', supplierRoutes);

// Configura as rotas de Lote
// Tudo que começar com /batches, mande para batchRoutes
app.use('/batches', batchRoutes);

// Configura as rotas de Promoção
// Tudo que começar com /promotions, mande para promotionRoutes
app.use('/promotions', promotionRoutes); // Jose

// --- ROTA DE TESTE DE CONEXÃO ---
// Esta rota testa se a API está de pé E se o banco de dados está conectado.
app.get('/', async (req, res) => {
  try {
    // 2. Tenta fazer uma query simples para verificar a conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    // Se a query funcionar, retorna 200 OK
    res.status(200).send({ 
      message: 'API Project 82 está online.',
      docs: 'http://localhost:3001/api-docs', // Link clicável para facilitar o acesso à documentação
      database: 'Conexão OK' 
    });
  } catch (error) {
    // Se a query falhar, a API está de pé, mas a conexão com o DB falhou
    res.status(500).send({ 
      message: 'API está online, mas a conexão com o banco falhou.', 
      error: (error as Error).message 
    });
  }
});

// Exporta o objeto 'app' para que o server.ts consiga importá-lo!
export { app };