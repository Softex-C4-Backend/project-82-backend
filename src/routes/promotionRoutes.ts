import { Router } from 'express';
import { PromotionController } from '../controllers/promotionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const promotionController = new PromotionController();

// Todas as rotas de promoções exigem autenticação
router.use(authMiddleware);

// =========================================================
// GRUPO 1: Rotas de LEITURA (Acesso para MANAGER e EMPLOYEE)
// =========================================================

// IMPORTANTE: Rotas estáticas devem vir antes das dinâmicas (/:id)
// Lista notificações de produtos próximos ao vencimento para sugerir promoções
router.get(
  '/notifications/expiring',
  authorizeRole(['MANAGER']),
  promotionController.getExpiringNotifications
);

// Listar todas as promoções
router.get(
  '/',
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  promotionController.list
);

// Buscar uma promoção específica por ID
router.get(
  '/:id',
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  promotionController.getById
);


// =========================================================
// GRUPO 2: Rotas de ESCRITA (Acesso APENAS para MANAGER)
// =========================================================

// Criar nova promoção
router.post(
  '/',
  authorizeRole(['MANAGER']),
  promotionController.create
);

// Atualizar promoção existente (Usando PUT para manter consistência com Produtos)
router.put(
  '/:id',
  authorizeRole(['MANAGER']),
  promotionController.update
);

// Deletar promoção
router.delete(
  '/:id',
  authorizeRole(['MANAGER']),
  promotionController.delete
);

export default router;