import { prisma } from '../database/prisma';
import { UnitOfMeasure } from '@prisma/client';

// DTO para Criação
interface CreateProductDTO {
  name: string;
  barcode: string;
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
  barcode?: string;
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
    // 1.1. Validação de Código de Barras (Regra de Negócio: Deve ser Único)
    const barcodeExists = await prisma.product.findUnique({
      where: { barcode: data.barcode }
    });
    if (barcodeExists) {
      throw new Error('Código de barras já cadastrado para outro produto.');
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

    // 4.2. Validação de Barcode (Se mudou, verifica duplicidade)
    if (data.barcode && data.barcode !== existingProduct.barcode) {
      const barcodeTaken = await prisma.product.findUnique({
        where: { barcode: data.barcode }
      });
      if (barcodeTaken) {
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