import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const saleController = new SaleController();

// === ROTAS DE VENDAS ===

// POST /sales
// Criar venda: Permite MANAGER e EMPLOYEE
router.post(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  (req, res) => saleController.createSale(req, res)
);

// GET /sales
// Listar vendas: Permite MANAGER e EMPLOYEE
router.get(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  (req, res) => saleController.listSales(req, res)
);

// GET /sales/:id
// Buscar venda por ID: Permite MANAGER e EMPLOYEE
router.get(
  '/:id',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  (req, res) => saleController.getSale(req, res)
);

// PUT /sales/:id/cancel
// Cancelar venda: Apenas MANAGER
router.put(
  '/:id/cancel',
  authMiddleware,
  authorizeRole(['MANAGER']),
  (req, res) => saleController.cancelSale(req, res)
);

export default router;
