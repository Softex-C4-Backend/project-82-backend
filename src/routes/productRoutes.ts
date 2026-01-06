import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const productController = new ProductController();

// =========================================================
// GRUPO 1: Rotas de LEITURA (Acesso para MANAGER e EMPLOYEE)
// =========================================================

// Listar todos os produtos
router.get(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  productController.listProducts
);

// Buscar produto por CÓDIGO
router.get(
  '/code/:code',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  productController.getProductByCode
);

// Buscar produto por ID
router.get(
  '/:id',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  productController.getProduct
);


// =========================================================
// GRUPO 2: Rotas de ESCRITA (Acesso APENAS para MANAGER)
// =========================================================

// Middleware de grupo: Todas as rotas abaixo exigem MANAGER
router.use(authMiddleware, authorizeRole(['MANAGER']));

router.post('/', productController.createProduct);       // Criar
router.put('/:id', productController.updateProduct);     // Editar
router.delete('/:id', productController.deleteProduct);  // Deletar

export default router;