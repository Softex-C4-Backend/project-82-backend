import { prisma } from '../database/prisma';
import { UnitOfMeasure } from '@prisma/client';

// DTO para Criação
interface CreateProductDTO {
  name: string;
  code: string;
  description?: string;
  price: number;
  cost?: number | null;
  stockQuantity: number;
  unitOfMeasure: UnitOfMeasure;
  categoryId: string;
  supplierId?: string;
}

// DTO para Atualização (Campos opcionais)
interface UpdateProductDTO {
  name?: string;
  code?: string;
  description?: string;
  price?: number;
  cost?: number | null;
  stockQuantity?: number;
  unitOfMeasure?: UnitOfMeasure;
  categoryId?: string;
  supplierId?: string;
  isAvailable?: boolean;
}

export class ProductService {

  // --- 1. CRIAR PRODUTO ---
  async createProduct(data: CreateProductDTO) {
    // 1.1. Validação de Código de Produto (Regra de Negócio: Deve ser Único)
    const codeExists = await prisma.product.findUnique({
      where: { code: data.code }
    });
    if (codeExists) {
      throw new Error('Código do produto já cadastrado para outro produto.');
    }

    // 1.2. Validação de Categoria (Regra de Negócio: Deve existir)
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    if (!categoryExists) {
      throw new Error('Categoria não encontrada ou inválida.');
    }
    
    // 1.3. Validação de Fornecedor (Se foi informado, deve existir)
    if (data.supplierId) {
        const supplierExists = await prisma.supplier.findUnique({
            where: { id: data.supplierId }
        });
        if (!supplierExists) {
            throw new Error('Fornecedor não encontrado ou inválido.');
        }
    }

    // 1.4. Criação
    const product = await prisma.product.create({
      data: {
        ...data,
        // Garante que o custo seja zero se não for informado
        cost: data.cost ?? 0, 
      },
    });

    return product;
  }

  // --- 2. LISTAR TODOS OS PRODUTOS ---
  async findAllProducts() {
    return prisma.product.findMany({
      orderBy: { name: 'asc' },
      // Inclui a categoria e o fornecedor para melhor exibição no front-end
      include: {
        category: true,
        supplier: true,
      }
    });
  }

  // --- 3. BUSCAR PRODUTO POR ID ---
  async findProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      }
    });
    if (!product) {
      throw new Error('Produto não encontrado.');
    }
    return product;
  }

  // --- 4. ATUALIZAR PRODUTO ---
  async updateProduct(id: string, data: UpdateProductDTO) {
    // 4.1. Verifica se o produto existe
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new Error('Produto não encontrado.');
    }

    // 4.2. Validação de Code (Se mudou, verifica duplicidade)
    if (data.code && data.code !== existingProduct.code) {
      const codeTaken = await prisma.product.findUnique({
        where: { code: data.code }
      });
      if (codeTaken) {
        throw new Error('Novo código de barras já está em uso.');
      }
    }

    // 4.3. Validação de Categoria
    if (data.categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!categoryExists) {
        throw new Error('Nova categoria não encontrada ou inválida.');
      }
    }
    
    // 4.4. Validação de Fornecedor
    if (data.supplierId) {
        const supplierExists = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
        if (!supplierExists) {
            throw new Error('Novo fornecedor não encontrado ou inválido.');
        }
    }

    // 4.5. Atualização
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: data,
      include: {
        category: true,
        supplier: true,
      }
    });

    return updatedProduct;
  }

  // --- 5. DELETAR PRODUTO ---
  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    // Regra: Deleta o produto (não há dependências complexas ainda como vendas)
    await prisma.product.delete({ where: { id } });

    return { message: 'Produto removido com sucesso.' };
  }
}