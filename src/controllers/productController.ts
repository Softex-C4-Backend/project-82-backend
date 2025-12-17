import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { ZodError, z } from 'zod';
import { UnitOfMeasure } from '@prisma/client';

const productService = new ProductService();

// Define a lista de unidades válidas para validação Zod (baseado no Enum)
const validUnitOfMeasures = Object.values(UnitOfMeasure);

// Schema de validação Zod para os dados de Produto
const productSchema = z.object({
  name: z.string().min(3, 'O nome do produto deve ter no mínimo 3 caracteres.'),
  code: z.string().min(5, 'O código do produto deve ter no mínimo 5 dígitos.'),
  description: z.string().optional(),
  price: z.number().positive('O preço de venda deve ser um valor positivo.'),
  cost: z.number().optional().nullable(), // Aceita ser null/undefined
  stockQuantity: z.number().int('A quantidade em estoque deve ser um número inteiro.').min(0, 'Estoque não pode ser negativo.'),
  categoryId: z.string().uuid('O ID da categoria é inválido.'),
  supplierId: z.string().uuid('O ID do fornecedor é inválido.').optional(),
  isAvailable: z.boolean().optional(),
  
  // Validação: Garante que a unidade de medida é um dos valores do nosso Enum
  unitOfMeasure: z.nativeEnum(UnitOfMeasure, {
    errorMap: () => ({ message: `Unidade de medida inválida. Deve ser uma das seguintes: ${validUnitOfMeasures.join(', ')}` }),
  }),
});

// Reutiliza o manipulador de erros que centraliza a lógica de 400, 404 e 500
const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  if (error instanceof Error) {
    if (error.message.includes('não encontrado') || error.message.includes('inválida')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Erro interno' });
};


export class ProductController {
  
  // POST /products
  async createProduct(req: Request, res: Response) {
    try {
      // Valida e sanitiza os dados de entrada
      const data = productSchema.parse(req.body); 
      const result = await productService.createProduct(data);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /products
  async listProducts(req: Request, res: Response) {
    try {
      const result = await productService.findAllProducts();
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /products/:id
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productService.findProductById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /products/code/:code
  async getProductByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      // Sanitização simples
      const codeSanitized = code?.trim();
      if (!codeSanitized) {
        return res.status(400).json({ message: 'Código do produto é obrigatório.' });
      }

      const result = await productService.findProductByCode(codeSanitized);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // PUT /products/:id
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Usa .partial() para permitir que apenas alguns campos sejam enviados
      const data = productSchema.partial().parse(req.body);
      
      const result = await productService.updateProduct(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // DELETE /products/:id
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }
}