import express from 'express';
// 1. Importa a conexão com o banco para testar se ele está ligado
import { prisma } from './database/prisma'; 
// 2. Importa as rotas de autenticação
import authRoutes from './routes/authRoutes';
// 3. Importa as rotas de teste
import testRoutes from './routes/testRoutes';

const app = express();

// Middleware: Permite que o Express leia o corpo das requisições como JSON
app.use(express.json());

// 3. Define o prefixo das rotas de Auth
// Todas as rotas de authRoutes começam com /auth  Ex: /auth/login
app.use('/auth', authRoutes);

// Configura as rotas de Teste
// Isso diz: "Tudo que começar com /test, mande para o arquivo testRoutes"
app.use('/test', testRoutes);

// Rota de saúde (Health Check)
// Esta rota testa se a API está de pé E se o banco de dados está conectado.
app.get('/', async (req, res) => {
  try {
    // 2. Tenta fazer uma query simples para verificar a conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    
    // Se a query funcionar, retorna 200 OK
    res.status(200).send({ 
      message: 'API Project 82 está online.',
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
// 3. Exporta o objeto 'app' para que o server.ts consiga importá-lo!
export { app };
