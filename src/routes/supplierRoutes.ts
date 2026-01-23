import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';

const router = Router();
const supplierController = new SupplierController();

// =========================================================
// GRUPO 1: Rotas de LEITURA (Acesso para MANAGER e EMPLOYEE)
// =========================================================

// Listar todos os fornecedores
router.get(
  '/',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  supplierController.listSuppliers
);

// Buscar fornecedores (Nome, CNPJ ou E-mail)
router.get(
  '/search',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  supplierController.searchSuppliers
);

// Buscar fornecedor por ID
router.get(
  '/:id',
  authMiddleware,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  supplierController.getSupplier
);


// =========================================================
// GRUPO 2: Rotas de ESCRITA (Acesso APENAS para MANAGER)
// =========================================================

// Middleware de grupo: Todas as rotas abaixo exigem MANAGER
router.use(authMiddleware, authorizeRole(['MANAGER']));

router.post('/', supplierController.createSupplier);       // Criar
router.put('/:id', supplierController.updateSupplier);     // Editar
router.delete('/:id', supplierController.deleteSupplier);  // Deletar

export default router;