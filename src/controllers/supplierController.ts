import { Request, Response } from 'express';
import { SupplierService } from '../services/supplierService';
import { ZodError, z } from 'zod';

const supplierService = new SupplierService();

// Reutiliza o manipulador de erros que centraliza a lógica de 400, 404 e 500
const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  if (error instanceof Error) {
    if (error.message.includes('não encontrado') || error.message.includes('vinculados')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Erro interno' });
};

// Schema de validação Zod
const supplierSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  // CNPJ é opcional, mas se for fornecido, deve ter um formato específico
  cnpj: z.string().length(14, 'O CNPJ deve ter exatamente 14 dígitos (somente números).').optional().nullable(),
  contactEmail: z.string().email('Formato de e-mail inválido.').optional().nullable(),
  phone: z.string().min(8, 'O telefone deve ter pelo menos 8 dígitos.').optional().nullable(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
});


export class SupplierController {
  
  // POST /suppliers
  async createSupplier(req: Request, res: Response) {
    try {
      // O Zod trata o 'nullable()' transformando strings vazias em null
      const data = supplierSchema.parse(req.body); 
      const result = await supplierService.createSupplier(data);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /suppliers
  async listSuppliers(req: Request, res: Response) {
    try {
      const result = await supplierService.findAllSuppliers();
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /suppliers/:id
  async getSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await supplierService.findSupplierById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // PUT /suppliers/:id
  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Partial validation for PUT
      const data = supplierSchema.partial().parse(req.body); 
      const result = await supplierService.updateSupplier(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // DELETE /suppliers/:id
  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await supplierService.deleteSupplier(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }
}