import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// Rota: POST http://localhost:3001/auth/login
// Quem acessa essa rota ativa o método 'login' do Controlador
router.post('/login', authController.login);

export default router;
