import { prisma } from '../database/prisma';
// @ts-ignore
import { UnitOfMeasure } from '@prisma/client';

// DTO para Criação
interface CreateProductDTO {
  name: string;
  code: string;
  description?: string;
  price: number;
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
  unitOfMeasure?: UnitOfMeasure;
  categoryId?: string;
  supplierId?: string;
  isAvailable?: boolean;
}

export class ProductService {

  // --- 1. CRIAR PRODUTO ---
  async createProduct(data: CreateProductDTO) {
    // 1.1. Validação de Código de Produto (Regra de Negócio: Deve ser Único)
    const codeExists = // @ts-ignore
    await prisma.product.findUnique({
      where: { code: data.code }
    });
    if (codeExists) {
      throw new Error('Código do produto já cadastrado para outro produto.');
    }

    // 1.2. Validação de Categoria (Regra de Negócio: Deve existir)
    const categoryExists = // @ts-ignore
    await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    if (!categoryExists) {
      throw new Error('Categoria não encontrada ou inválida.');
    }
    
    // 1.3. Validação de Fornecedor (Se foi informado, deve existir)
    if (data.supplierId) {
        const supplierExists = // @ts-ignore
    await prisma.supplier.findUnique({
            where: { id: data.supplierId }
        });
        if (!supplierExists) {
            throw new Error('Fornecedor não encontrado ou inválido.');
        }
    }

    // 1.4. Criação
    const product = // @ts-ignore
    await prisma.product.create({
      data: {
        ...data,
        stockQuantity: 0,  // Inicializa a quantidade em estoque como 0
        cost: null,
      },
    });

    return product;
  }

  // --- 2. LISTAR TODOS OS PRODUTOS ---
  async findAllProducts() {
    // @ts-ignore
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
    const product = // @ts-ignore
    await prisma.product.findUnique({
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

  // --- 4. BUSCAR PRODUTO POR CÓDIGO ---
  async findProductByCode(code: string) {
    const product = // @ts-ignore
    await prisma.product.findUnique({
      where: { code },
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

  // --- 5. ATUALIZAR PRODUTO ---
  async updateProduct(id: string, data: UpdateProductDTO) {
    // 5.1. Regra de Negócio: Não permite alterar a quantidade em estoque via produto
    if ('stockQuantity' in data) throw new Error('O estoque não pode ser alterado pelo produto. Use Lotes.');
    
    // 5.2. Verifica se o produto existe
    const existingProduct = // @ts-ignore
    await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new Error('Produto não encontrado.');
    }

    // 5.3. Validação de Code (Se mudou, verifica duplicidade)
    if (data.code && data.code !== existingProduct.code) {
      const codeTaken = // @ts-ignore
    await prisma.product.findUnique({
        where: { code: data.code }
      });
      if (codeTaken) {
        throw new Error('Novo código de barras já está em uso.');
      }
    }

    // 5.4. Validação de Categoria
    if (data.categoryId) {
      const categoryExists = // @ts-ignore
      await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!categoryExists) {
        throw new Error('Nova categoria não encontrada ou inválida.');
      }
    }

    // 5.5. Validação de Fornecedor
    if (data.supplierId) {
        const supplierExists = // @ts-ignore
        await prisma.supplier.findUnique({ where: { id: data.supplierId } });
        if (!supplierExists) {
            throw new Error('Novo fornecedor não encontrado ou inválido.');
        }
    }

    // 5.6. Atualização
    const updatedProduct = // @ts-ignore
    await prisma.product.update({
      where: { id },
      data: data,
      include: {
        category: true,
        supplier: true,
      }
    });

    return updatedProduct;
  }

  // --- 6. DELETAR PRODUTO ---
  async deleteProduct(id: string) {
    const product = // @ts-ignore
    await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    // Regra 1: Não deixa deletar se houver estoque
    if (product.stockQuantity > 0) {
      throw new Error('Não é possível deletar um produto com estoque. Zere o estoque via Lotes.');
    }

    // Regra 2: Não deixa deletar se houver lotes vinculados (quando o model Batch existir)
    const batchesCount = // @ts-ignore
    await prisma.batch.count({ where: { productId: id } });
    if (batchesCount > 0) {
      throw new Error(`Não é possível deletar. Existem ${batchesCount} lotes vinculados a este produto.`);
    }  

    // Regra 3: Deleta o produto (não há dependências complexas ainda como vendas)
    // @ts-ignore
    await prisma.product.delete({ where: { id } });

    return { message: 'Produto removido com sucesso.' };
  }
}