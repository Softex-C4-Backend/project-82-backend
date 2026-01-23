import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const dashboardController = new DashboardController();

// Rota para obter produtos com baixo estoque
router.get(
  '/low-stock',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  dashboardController.getLowStock
);

// Rota para obter produtos em falta (estoque zerado)
router.get(
  '/out-of-stock',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  dashboardController.getOutOfStock
);

// Rota para obter valor total do estoque
router.get(
  '/inventory-value',
  authMiddleware,
  authorizeRole(['MANAGER']),
  dashboardController.getInventoryValue
);

// Rota para evolução de vendas (Gráfico)
router.get(
  '/sales-evolution',
  authMiddleware,
  authorizeRole(['MANAGER']),
  dashboardController.getSalesEvolution
);

export default router;