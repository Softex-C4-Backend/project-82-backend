import { Request, Response, NextFunction } from 'express';

// Recebe uma lista de cargos permitidos (ex: ['MANAGER'])
export function authorizeRole(allowedRoles: string[]) {
  
  // Retorna a função middleware real que o Express vai executar
  return (req: Request, res: Response, next: NextFunction) => {
    
    // 1. Verificação de Segurança (Safety Check)
    // O authMiddleware JÁ DEVE ter rodado antes e preenchido o req.user.
    // Se req.user não existir, significa que a ordem dos middlewares está errada.
    if (!req.user) {
      return res.status(500).json({ message: 'Erro de servidor: Usuário não autenticado no fluxo.' });
    }

    // 2. Verificação de Permissão (RBAC)
    // Verifica se o cargo do usuário (req.user.role) está na lista de permitidos.
    if (!allowedRoles.includes(req.user.role)) {
      // 403 Forbidden: O servidor entendeu quem você é, mas se recusa a autorizar.
      return res.status(403).json({ 
        message: 'Acesso negado: Você não tem permissão para realizar esta ação.' 
      });
    }

    // 3. Autorizado
    return next();
  };
}