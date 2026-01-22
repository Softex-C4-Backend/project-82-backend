import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * Rota para o Dashboard: Produtos com Estoque Baixo
 * Acesso permitido para MANAGER e EMPLOYEE, pois ambos precisam 
 * monitorar o que está acabando para repor ou organizar.
 */
router.get(
  '/low-stock',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  dashboardController.getLowStock
);

export default router;