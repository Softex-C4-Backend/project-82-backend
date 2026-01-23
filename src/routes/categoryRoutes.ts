import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const categoryController = new CategoryController();

// =========================================================
// Rota de LEITURA (GET) - Acesso liberado para MANAGER e EMPLOYEE
// =========================================================

// Listar todas as categorias
router.get(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  categoryController.listCategories
);

// Buscar categorias por nome
router.get(
  '/search',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  categoryController.searchCategories
);

// Buscar categoria por ID
router.get(
  '/:id',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  categoryController.getCategory
);


// =========================================================
// Rotas de ESCRITA (POST, PUT, DELETE) - Acesso APENAS para MANAGER
// =========================================================

// Middleware de grupo: Todas as rotas abaixo exigem MANAGER
router.use(authMiddleware, authorizeRole(['MANAGER']));

router.post('/', categoryController.createCategory);       // Criar
router.put('/:id', categoryController.updateCategory);     // Editar
router.delete('/:id', categoryController.deleteCategory);  // Deletar

export default router;