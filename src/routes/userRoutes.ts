import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const userController = new UserController();

// =========================================================
// Rotas para QUALQUER usuário autenticado (Logado)
// =========================================================

// Trocar a própria senha
router.post('/change-password', authMiddleware, userController.changePassword);

// Editar usuário (Qualquer um logado pode tentar editar)
router.put('/me', authMiddleware, userController.updateProfile);

// Detalhes do próprio usuário logado
router.get('/me', authMiddleware, userController.getProfile);


// =========================================================
// Rotas ADMINISTRATIVAS (Apenas MANAGER)
// =========================================================

// Criar novo funcionário/gestor
// Regra: Tem que estar logado (authMiddleware) E tem que ser Gerente (authorizeRole)
router.post(
  '/', 
  authMiddleware, 
  authorizeRole(['MANAGER']), 
  userController.createUser
);

// Listar todos os usuários
router.get(
  '/', 
  authMiddleware, 
  authorizeRole(['MANAGER']), 
  userController.listUsers
);

// Busca de Usuários 
router.get(
  '/search',
  authMiddleware,
  authorizeRole(['MANAGER']),
  userController.searchUsers
);

// Buscar detalhes de um usuário específico por ID
router.get(
  '/:id', 
  authMiddleware, 
  authorizeRole(['MANAGER']), 
  userController.getUser
);

// Deletar um usuário
router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRole(['MANAGER']), 
  userController.deleteUser
);



export default router;