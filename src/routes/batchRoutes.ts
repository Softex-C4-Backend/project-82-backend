import { Router } from 'express';
import { BatchController } from '../controllers/batchController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const batchController = new BatchController();

// =========================================================
// GRUPO 1: Rotas de LEITURA (Acesso para MANAGER e EMPLOYEE)
// =========================================================

// Listar lotes (Aceita ?productId= no query param)
router.get(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  batchController.listBatches
);

// Listar lotes que estão para vencer em X dias (padrão 30 dias)
router.get(
  '/expiring',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  batchController.getExpiring
);

// Buscar detalhes de um lote específico por ID
router.get(
  '/:id',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  batchController.getBatch
);

// =========================================================
// GRUPO 2: Rotas de ESCRITA (Acesso APENAS para MANAGER)
// =========================================================

// Todas as rotas abaixo exigem obrigatoriamente cargo de Gerente
router.use(authMiddleware, authorizeRole(['MANAGER']));

router.post('/', batchController.createBatch);    // Dar entrada num novo lote
router.put('/:id', batchController.updateBatch); // Atualizar dados do lote
router.delete('/:id', batchController.deleteBatch); // Remover lote (Gera decremento no stock do produto)

export default router;
