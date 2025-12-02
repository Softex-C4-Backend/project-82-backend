import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Iniciando a criação do Usuário Mestre...');

  // 1. Pegar os dados sensíveis do arquivo .env
  const email = process.env.SEED_MANAGER_EMAIL;
  const password = process.env.SEED_MANAGER_PASSWORD;
  const registration = process.env.SEED_MANAGER_MATRICULA;

  // Validação de segurança
  if (!email || !password || !registration) {
    throw new Error('[SEED ERROR] Variáveis de ambiente SEED_MANAGER_* não definidas no .env');
  }

  // 2. Criptografar a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Criar ou Atualizar o Gestor
  const manager = await prisma.user.upsert({
    where: { registration }, 
    update: {}, 
    create: {
      email,
      name: 'Gestor Admin',
      registration,             
      password: hashedPassword,
      role: Role.MANAGER,       
      status: UserStatus.ACTIVE 
    },
  });

  console.log(`[SEED] Gestor criado/verificado com sucesso: ${manager.name} (${manager.email})`);
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
