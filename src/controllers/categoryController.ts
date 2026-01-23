import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { ZodError, z } from 'zod';

const categoryService = new CategoryService();

// Schema de validação Zod para os dados de Categoria
const categorySchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
});

// Reutiliza o manipulador de erros que criamos no UserController
const handleError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
  if (error instanceof Error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Erro interno' });
};


export class CategoryController {
  
  // POST /categories
  async createCategory(req: Request, res: Response) {
    try {
      const data = categorySchema.parse(req.body);
      const result = await categoryService.createCategory(data);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /categories
  async listCategories(req: Request, res: Response) {
    try {
      const result = await categoryService.findAllCategories();
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /categories/:id
  async getCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await categoryService.findCategoryById(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // PUT /categories/:id
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Partial validation for PUT
      const data = categorySchema.partial().parse(req.body); 
      const result = await categoryService.updateCategory(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // DELETE /categories/:id
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // GET /categories/search?q=termo
  async searchCategories(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const searchTerm = q?.toString().trim();

      if (!searchTerm) {
        return res.status(400).json({ message: 'Informe um termo para a busca.' });
      }

      const result = await categoryService.searchCategories(searchTerm);
      return res.status(200).json(result);
    } catch (error) {
      // Use o seu padrão de erro aqui (handleError ou o catch padrão)
      const message = error instanceof Error ? error.message : 'Erro ao buscar categorias';
      return res.status(400).json({ message });
    }
  }
}