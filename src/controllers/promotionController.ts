import { Request, Response } from 'express';
import { PromotionService } from '../services/promotionService';
import { z, ZodError } from 'zod';

const promotionService = new PromotionService();

const promotionSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_VALUE']),
  discountValue: z.coerce.number().positive('O valor do desconto deve ser positivo.'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  productId: z.string().uuid('ID do produto inválido.'),
  isActive: z.boolean().optional(),
});

const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  
  if (error instanceof Error) {
    const normalize = (s: string) => 
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const msg = normalize(error.message);

    // Erros 404
    if (msg.includes('nao encontrada') || msg.includes('nao encontrado')) {
      return res.status(404).json({ message: error.message });
    }

    // Erros 400 (Regras de negócio, como sobreposição de datas)
    if (
      msg.includes('ja existe uma promocao') || 
      msg.includes('posterior') || 
      msg.includes('datas invalidas')
    ) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(400).json({ message: error.message });
  }
  
  return res.status(500).json({ message: 'Erro interno no servidor de promoções' });
};

export class PromotionController {
  async create(req: Request, res: Response) {
    try {
      const data = promotionSchema.parse(req.body);
      const result = await promotionService.createPromotion(data);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { productId } = req.query;
      const result = await promotionService.listPromotions(productId as string);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await promotionService.getPromotionById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateSchema = promotionSchema.partial();
      const data = updateSchema.parse(req.body);
      const result = await promotionService.updatePromotion(id, data as any);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await promotionService.deletePromotion(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async getExpiringNotifications(req: Request, res: Response) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const result = await promotionService.getExpiringProducts(days);
      
      const notifications = (result as any[]).map((batch: any) => ({
        type: 'EXPIRATION_WARNING',
        message: `O produto "${batch.product.name}" (Lote: ${batch.code || 'N/A'}) está próximo do vencimento (${new Date(batch.expirationDate).toLocaleDateString()}).`,
        batchId: batch.id,
        productId: batch.productId,
        expirationDate: batch.expirationDate,
        currentQuantity: batch.currentQuantity,
        suggestPromotion: true
      }));

      return res.status(200).json(notifications);
    } catch (error) {
      return handleError(res, error);
    }
  }
}