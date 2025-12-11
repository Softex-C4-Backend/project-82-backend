import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { User, Role, UserStatus } from '@prisma/client';

// Tipagem para o que precisamos receber para criar um usuário
interface CreateUserDTO {
  name: string;
  email: string;
  registration: string;
  role: Role;
}

// Tipagem para o que podemos atualizar em um usuário
interface UpdateUserDTO {
  name?: string;
  email?: string;
}

export class UserService {
/// --- MÉTODOS AUXILIARES ---
  
  // Função Utilitária: Gera uma senha aleatória de 6 caracteres (ex: "A7x9B2")
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Remove a senha do objeto de retorno
  private removePassword(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      registration: user.registration,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

// --- 1. CRIAR USUÁRIO (CREATE) Apenas MANAGER usará ---
  async createUser({ name, email, registration, role }: CreateUserDTO) {
    
    // A. Verificar se já existe (E-mail ou Matrícula duplicada)
    const userAlreadyExists = await prisma.user.findFirst({
      where: { OR: [{ email }, { registration }] }
    });

    if (userAlreadyExists) {
      throw new Error('Usuário já cadastrado com este E-mail ou Matrícula.');
    }

    // B. Gerar a senha provisória
    const tempPassword = this.generateTemporaryPassword();
    // C. Criptografar a senha provisória antes de salvar
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // D. Salvar no Banco (Status nasce como PENDING por padrão no Schema)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        registration,
        password: hashedPassword,
        role,
        // status: UserStatus.PENDING (Isso já é o padrão no banco, não precisa mandar)
      },
    });

    // E. Retornar os dados (INCLUINDO a senha provisória para o Gestor ver)
    return {
      user: this.removePassword(user),
      temporaryPassword: tempPassword // O Gestor copia isso e manda pro funcionário
    };
  }

 // --- 2. TROCAR SENHA (ONBOARDING) ---
  async changePassword(userId: string, newPasswordRaw: string) {
    // A. Buscamos o usuário ANTES de atualizar para saber o status atual
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // B. Verifica se o usuário existe
    if (!user) throw new Error('Usuário não encontrado.');

    // C. Valida se a senha é igual
    const isSamePassword = await bcrypt.compare(newPasswordRaw, user.password);
    if (isSamePassword) throw new Error('A nova senha não pode ser igual à senha antiga.');

    // D. Guardamos o status anterior para decidir a mensagem
    const previousStatus = user.status;
    
    // E. Criptografar a nova senha
    const newHashedPassword = await bcrypt.hash(newPasswordRaw, 10);

    // F. Atualizar o usuário no banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newHashedPassword,
        status: UserStatus.ACTIVE  // Ativa a conta automaticamente!
      }
    });

    // G. Lógica da Mensagem
    if (previousStatus === UserStatus.PENDING) {
      return { message: 'Senha definida com sucesso. Sua conta foi ativada!' };
    } else {
      return { message: 'Senha alterada com sucesso.' };
    }
  }

// --- 3. LISTAR TODOS ---
  async findAllUsers() {  
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' } // Ordena por nome A-Z
    });
    // Removemos a senha de todos os usuários da lista
    return users.map(user => this.removePassword(user));
  }

// --- 4. BUSCAR POR ID ---
  async findUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuário não encontrado.');

    return this.removePassword(user);
  }

// --- 5. ATUALIZAR (UPDATE) ---
  async updateUser(id: string, data: UpdateUserDTO) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuário não encontrado.');

    // Se estiver mudando o e-mail, verifica se já existe outro usuário com ele
    if (data.email && data.email !== user.email) {
      const emailTaken = await prisma.user.findFirst({ where: { email: data.email } });
      if (emailTaken) throw new Error('Este e-mail já está em uso.');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
      }
    });

    return this.removePassword(updatedUser);
  }

// --- 6. DELETAR (DELETE) ---
  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuário não encontrado.');

    await prisma.user.delete({ where: { id } });

    return { message: 'Usuário removido com sucesso.' };
  }
}