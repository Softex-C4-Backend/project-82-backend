import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();

// 1. Rota Pública: Não tem middleware nenhum.
router.get('/public', (req, res) => {
  res.status(200).json({ message: 'Rota Pública: Você entrou sem crachá.' });
});

// 2. Rota Protegida (Autenticada): Exige apenas que o token seja válido.
// Funciona para MANAGER e EMPLOYEE.
router.get('/secure', authMiddleware, (req, res) => {
  res.status(200).json({ 
    message: 'Rota Segura: Você tem um token válido!',
    user: req.user // Retorna os dados que o middleware extraiu do token
  });
});

// 3. Rota de Admin (Autorizada): Exige token válido E cargo 'MANAGER'.
// Se um EMPLOYEE tentar entrar aqui, deve receber erro 403.
router.get('/admin', authMiddleware, authorizeRole(['MANAGER']), (req, res) => {
  res.status(200).json({ 
    message: 'Rota Admin: Você é um Gestor autorizado!',
    user: req.user
  });
});

export default router;