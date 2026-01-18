import { Request, Response } from 'express';
import { SaleService } from '../services/saleService';
import { ZodError, z } from 'zod';
import { PaymentMethod } from '@prisma/client';

const saleService = new SaleService();

// Get valid payment methods from Prisma Enum
const validPaymentMethods = Object.values(PaymentMethod);

// Schema de validação Zod para Item de Venda
const saleItemSchema = z.object({
  productId: z.string().uuid('O ID do produto é inválido.'),
  quantity: z.coerce.number().positive('A quantidade deve ser um valor positivo.')
});

// Schema de validação Zod para Criação de Venda
const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Uma venda deve conter pelo menos um item.'),
  paymentMethod: z.enum(validPaymentMethods as [string, ...string[]], {
    errorMap: () => ({
      message: `Método de pagamento inválido. Deve ser um dos seguintes: ${validPaymentMethods.join(', ')}`
    })
  })
});

// Tipo inferido do Zod
type CreateSaleInput = z.infer<typeof createSaleSchema>;

// === NORMALIZADOR DE ERROS ===
// Remove acentos e converte para minúsculas para comparações
const normalizeError = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
};

// Reutiliza o manipulador de erros que centraliza a lógica de 400, 404 e 500
const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados de entrada inválidos', errors: error.errors });
  }

  if (error instanceof Error) {
    const normalizedMessage = normalizeError(error.message);

    // Verifica se o erro é de estoque insuficiente ou produto não encontrado (404)
    if (
      normalizedMessage.includes('nao encontrado') ||
      normalizedMessage.includes('invalido') ||
      normalizedMessage.includes('nao esta disponivel')
    ) {
      return res.status(404).json({ message: error.message });
    }

    // Erros de estoque insuficiente são 400 (Bad Request)
    if (normalizedMessage.includes('quantidade insuficiente') || normalizedMessage.includes('nenhum lote')) {
      return res.status(400).json({ message: error.message });
    }

    // Erros de negócio geral (já foi cancelada, etc)
    if (normalizedMessage.includes('cancelada')) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Erro interno do servidor' });
};

export class SaleController {

  // === POST /sales (Criar Venda) ===
  async createSale(req: Request, res: Response) {
    try {
      // 1. Validar dados de entrada
      const data = createSaleSchema.parse(req.body);

      // 2. Segurança: Recuperar userId do JWT (req.user)
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const userId = req.user.userId;

      // 3. Chamar o serviço
      const sale = await saleService.createSale({
        userId,
        items: data.items,
        paymentMethod: data.paymentMethod as PaymentMethod
      });

      // 4. Retornar resultado
      return res.status(201).json({
        message: 'Venda criada com sucesso.',
        sale
      });

    } catch (error) {
      return handleError(res, error);
    }
  }

  // === GET /sales (Listar Vendas) ===
  async listSales(req: Request, res: Response) {
    try {
      // Verificar se o usuário quer listar apenas suas próprias vendas
      const { myOnly } = req.query;
      
      if (myOnly === 'true' && req.user) {
        // Listar vendas do usuário atual
        const sales = await saleService.listSalesByVendor(req.user.userId);
        return res.status(200).json(sales);
      }

      // Listar todas as vendas
      const sales = await saleService.listSales();
      return res.status(200).json(sales);

    } catch (error) {
      return handleError(res, error);
    }
  }

  // === GET /sales/:id (Buscar Venda por ID) ===
  async getSale(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const sale = await saleService.findSaleById(id);
      return res.status(200).json(sale);

    } catch (error) {
      return handleError(res, error);
    }
  }

  // === POST /sales/:id/cancel (Cancelar Venda) ===
  async cancelSale(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await saleService.cancelSale(id);
      return res.status(200).json(result);

    } catch (error) {
      return handleError(res, error);
    }
  }
}
