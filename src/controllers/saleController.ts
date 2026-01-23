import { Request, Response } from 'express';
import { SaleService } from '../services/saleService';
import { ZodError, z } from 'zod';
import { PaymentMethod } from '@prisma/client';

const saleService = new SaleService();

const createSaleSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }),
  items: z.array(
    z.object({
      productId: z.string().uuid('ID de produto inválido.'),
      quantity: z.coerce.number().int().positive('A quantidade deve ser um número inteiro positivo.'),
      unitPrice: z.coerce.number().positive('O preço unitário deve ser um número positivo.'),
    })
  ).min(1, 'A venda deve conter pelo menos um produto.'),
});

const cancelSaleSchema = z.object({
  reason: z.string().min(5, 'O motivo do cancelamento deve ter no mínimo 5 caracteres.'),
});

const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  
  if (error instanceof Error) {
    const normalize = (s: string) => 
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const msg = normalize(error.message);

    if (msg.includes('nao encontrado') || msg.includes('invalid')) {
      return res.status(404).json({ message: error.message });
    }

    if (
      msg.includes('indisponivel') || 
      msg.includes('insuficiente') ||
      msg.includes('inconsist') ||
      msg.includes('ja foi cancelada') ||
      msg.includes('preco invalido') // Captura a nova validação de segurança do SaleService
    ) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(400).json({ message: error.message });
  }
  
  return res.status(500).json({ message: 'Erro interno no servidor de vendas' });
};

export class SaleController {

  // === POST /sales (Criar Venda) ===
  async createSale(req: Request, res: Response) {
    try {
      // 1. Validar dados de entrada
      const data = createSaleSchema.parse(req.body);

      // 2. Segurança: Recuperar userId do JWT (req.user)
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const result = await saleService.createSale({ ...data, userId });
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // === GET /sales (Listar Vendas) ===
  async listSales(req: Request, res: Response) {
    try {
      // Pega o ID do usuário logado
      const userId = (req as any).user?.userId;
      // Verifica se o front-end enviou ?myOnly=true na URL
      const { myOnly } = req.query;

      if (myOnly === 'true' && userId) {
        const result = await saleService.listSalesByVendor(userId);
        return res.status(200).json(result);
      }

      const result = await saleService.listSales();
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // === GET /sales/:id (Buscar Venda por ID) ===
  async getSale(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await saleService.getSaleById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // === POST /sales/:id/cancel (Cancelar Venda) ===
  async cancelSale(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = cancelSaleSchema.parse(req.body);
      
      const result = await saleService.cancelSale(id, reason);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
