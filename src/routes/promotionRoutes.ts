import { Router } from 'express';
import { PromotionController } from '../controllers/promotionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const promotionController = new PromotionController();

// Todas as rotas de promoções exigem autenticação
router.use(authMiddleware);

// Apenas Managers podem criar, atualizar ou deletar promoções
router.post('/', authorizeRole(['MANAGER']), promotionController.create);
router.patch('/:id', authorizeRole(['MANAGER']), promotionController.update);
router.delete('/:id', authorizeRole(['MANAGER']), promotionController.delete);

// Managers também veem as notificações de vencimento
router.get('/notifications/expiring', authorizeRole(['MANAGER']), promotionController.getExpiringNotifications);

// Listagem e busca por ID podem ser acessadas por Employees também (para visualização no PDV/Estoque)
router.get('/', promotionController.list);
router.get('/:id', promotionController.getById);

export default router;
