import { Router } from 'express';
import { UtilController } from '../controllers/utilController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const utilController = new UtilController();

// Rotas de utilidade, que exigem apenas que o usuário esteja logado.
// Listar unidades de medida (UNIT, KG, LITER)
router.get(
  '/unit-of-measures', 
  authMiddleware, 
  utilController.listUnitOfMeasures
);

export default router;