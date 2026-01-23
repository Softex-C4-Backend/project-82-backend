import { Request, Response } from "express";
import { BatchService } from '../services/batchService';
import { ZodError, z } from 'zod';

const batchService = new BatchService();

// Schema de validação Zod para os dados do Lote
const batchSchema = z.object({
  productId: z.string().uuid('O ID do produto é inválido.'),
  code: z.string().optional().nullable(),
  receivedDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date({ invalid_type_error: 'Data de vencimento inválida.' }),
  initialQuantity: z.coerce.number().int('A quantidade deve ser um número inteiro.').positive('A quantidade deve ser maior que zero.'),
  unitCost: z.coerce.number().positive('O custo unitário deve ser um valor positivo.'),
});

// Manipulador de erros
const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  if (error instanceof Error) {
    if (error.message.includes('não encontrado') || error.message.includes('inválid')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Erro interno no servidor' });
};

export class BatchController {
  
  // --- 1. CRIAR LOTE (POST /batches) ---
  async createBatch(req: Request, res: Response) {
    try {
      // Valida os dados de entrada
      const data = batchSchema.parse(req.body);
      
      const result = await batchService.createBatch(data);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // --- 2. LISTAR LOTES (GET /batches?productId=...) ---
  async listBatches(req: Request, res: Response) {
    try {
      const { productId } = req.query;
      
      const productIdValue = typeof productId === 'string' ? productId : undefined;

      const result = await batchService.findAllBatches(productIdValue);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // --- 3. BUSCAR LOTE POR ID (GET /batches/:id) ---
  async getBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await batchService.findBatchById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // --- 4. ATUALIZAR LOTE (PATCH /batches/:id) ---
  async updateBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Usa .partial() mas removemos productId e initialQuantity para impedir edição desses campos
      const updateSchema = batchSchema
        .omit({ productId: true, initialQuantity: true })
        .partial()
        .extend({
          expirationDate: z.coerce.date({ invalid_type_error: 'Data de vencimento inválida.' }).optional(),
        });
      const data = updateSchema.parse(req.body);

      const result = await batchService.updateBatch(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // --- 5. DELETAR LOTE (DELETE /batches/:id) ---
  async deleteBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await batchService.deleteBatch(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // --- 6. LOTES PRÓXIMOS AO VENCIMENTO (GET /batches/expiring) ---
  async getExpiring(req: Request, res: Response) {
    try {
      // Permite que o usuário envie ?days=15 na URL, ou assume 30 por padrão
      const days = req.query.days ? Number(req.query.days) : 30;
      
      const result = await batchService.getExpiringBatches(days);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }
}


