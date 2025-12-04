
import { Request, Response } from 'express';
import { loginSchema } from '../schemas/authSchemas';
import { ZodError } from 'zod';

const authService = new AuthService();

export class AuthController {
  
  async login(req: Request, res: Response) {
    try {
      // 1. Validação dos dados (Zod)
      // Se o usuário não mandar senha, o Zod explode um erro aqui.
      const { identifier, password } = loginSchema.parse(req.body);

      // 2. Chamada ao Serviço (Lógica de Negócio)
      const result = await authService.login({ identifier, password });

      // 3. Resposta de Sucesso
      return res.status(200).json(result);

    } catch (error) {
      // Tratamento de Erros

      // Se for erro de validação (Zod), retorna 400 (Bad Request)
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Dados de entrada inválidos', 
          errors: error.errors 
        });
      }

      // Se for erro de negócio (senha errada, etc), retorna 401 (Unauthorized)
      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }

      // Erro genérico
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }
  }
}
