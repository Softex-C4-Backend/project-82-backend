import { PrismaClient } from '@prisma/client';

// Cria a única instância do Prisma Client
const prisma = new PrismaClient();

// Exporta o prisma para ser usado em todo o projeto
export { prisma };
