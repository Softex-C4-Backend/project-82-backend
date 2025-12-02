import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { loginSchema } from '../schemas/authSchemas';

// Tipagem para os dados de entrada (inferida do Zod)
type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  
  // Função principal de Login
  async login({ identifier, password }: LoginInput) {
    
    // 1. Buscar o usuário no banco (Pelo E-mail OU pela Matrícula)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { registration: identifier } // Procura pelo campo 'registration'
        ]
      }
    });

    // 2. Se não achar o usuário, erro de segurança genérico (para não dar dicas)
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // 3. Verificar se a conta está ativa
    if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
      throw new Error('Usuário inativo. Contate o suporte.');
    }

    // 4. Comparar a senha enviada com o Hash do banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // 5. Gerar o Token JWT (O Crachá)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Erro interno: JWT_SECRET não configurado.');
    }

    // O token carrega o ID e o ROLE do usuário
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      secret, 
      { expiresIn: '1d' } // Expira em 1 dia
    );

    // 6. Retornar os dados (sem a senha!)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }
}
