import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { createEmployeeSchema, setPasswordSchema } from '../schemas/authSchemas';
import { ZodError } from 'zod';

const userService = new UserService();

export class UserController {
  
  // 1. CRIAR USUÁRIO (POST /users) - (Apenas Manager)
  async createUser(req: Request, res: Response) {
    try {
      // Valida os dados (Nome, Email, Matrícula)
      // Nota: Precisamos adicionar 'role' no schema ou pegar do body manualmente por enquanto
      const data = createEmployeeSchema.parse(req.body);
      
      // Pega o cargo do corpo da requisição (MANAGER ou EMPLOYEE)
      // Se não vier, assume EMPLOYEE por segurança
      const role = req.body.role || 'EMPLOYEE';
      const result = await userService.createUser({ ...data, role });
      return res.status(201).json(result);

    } catch (error) {
        return UserController.handleError(res, error);
    }
  }

  // 2. TROCAR SENHA (POST /users/change-password) - (Qualquer um logado)
  async changePassword(req: Request, res: Response) {
    try {
      // O ID vem do Token (authMiddleware)
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });

      // Valida se a senha nova tem 6 caracteres
      const { newPassword } = setPasswordSchema.parse(req.body);
      const result = await userService.changePassword(userId, newPassword);
      return res.status(200).json(result);

    } catch (error) {
        return UserController.handleError(res, error);
    }
  }

  // 3. LISTAR TODOS (GET /users) - (Apenas Manager)
  async listUsers(req: Request, res: Response) {
    try {
      const result = await userService.findAllUsers();
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }

  // 4. BUSCAR POR ID (GET /users/:id) - (Apenas Manager)
  async getUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.findUserById(id);
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }

  // 5. ATUALIZAR (PUT /users/:id) - (Qualquer um logado)
  async updateProfile(req: Request, res: Response) {
    try {
      const id = req.user?.userId; // Pegamos o ID do token (quem está logado)
      if (!id) return res.status(401).json({ message: 'Usuário não autenticado' });

      // Extraímos apenas o que é permitido editar (Nome e Email)
      const { name, email } = req.body;
      const result = await userService.updateProfile(id, { name, email });
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }

  // 6. DELETAR (DELETE /users/:id) - (Apenas Manager)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }

  // 7. USUARIO LOGADO PEGA SEU PRÓPRIO PERFIL (GET /users/profile) - (Qualquer um logado)
  async getProfile(req: Request, res: Response) {
    try {
      const id = req.user?.userId;
      if (!id) return res.status(401).json({ message: 'Usuário não autenticado' });

      const result = await userService.getProfile(id);
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }

  // 8. BUSCAR/FILTRAR USUÁRIOS (GET /users/search?query=...) - (Apenas Manager)
  async searchUsers(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ message: 'Parâmetro de busca inválido.' });
      }

      const result = await userService.searchUsers(query);
      return res.status(200).json(result);
    } catch (error) {
      return UserController.handleError(res, error);
    }
  }



  // --- MÉTODO AUXILIAR DE ERRO (DRY) ---
  // Centraliza a lógica de resposta de erro para não repetir código
  private static handleError(res: Response, error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    if (error instanceof Error) {
      // Se o erro for "Não encontrado", devolve 404. Se for lógica (senha igual), devolve 400.
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno' });
  }
}