import { prisma } from '../database/prisma';
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
  minStock?: number;
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
  minStock?: number;
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
        stockQuantity: 0,  // Inicializa a quantidade em estoque como 0
        cost: null,
      },
    });

    return product;
  }

  // --- 2. LISTAR TODOS OS PRODUTOS ---
  async findAllProducts() {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        supplier: true,
        promotions: { where: { isActive: true } } // Traz as promos ativas
      }
    });

    // Passa cada produto pela lógica de cálculo antes de enviar para o controller
    return products.map(p => this.applyPromotionLogic(p));
  }

  // --- 3. BUSCAR PRODUTO POR ID ---
  async findProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        promotions: { where: { isActive: true } }
      }
    });

    if (!product) throw new Error('Produto não encontrado.');

    return this.applyPromotionLogic(product);
  }

  // --- 4. BUSCAR PRODUTO POR CÓDIGO ---
  async findProductByCode(code: string) {
    const product = await prisma.product.findUnique({
      where: { code },
      include: {
        category: true,
        supplier: true,
        promotions: { where: { isActive: true } }
      }
    });

    if (!product) throw new Error('Produto não encontrado.');

    return this.applyPromotionLogic(product);
  }

  // --- 5. RELATÓRIO DE VALOR EM ESTOQUE ---
  async searchProducts(term: string) {
    const commonInclude = {
      category: true,
      supplier: true,
      promotions: { where: { isActive: true } }
    };

    const productByCode = await prisma.product.findUnique({
      where: { code: term },
      include: commonInclude
    });

    if (productByCode) {
      return [this.applyPromotionLogic(productByCode)];
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { code: { contains: term } }
        ]
      },
      include: commonInclude,
      take: 20
    });

    return products.map(p => this.applyPromotionLogic(p));
  }

  // --- 6. ATUALIZAR PRODUTO ---
  async updateProduct(id: string, data: UpdateProductDTO) {
    // 5.1. Regra de Negócio: Não permite alterar a quantidade em estoque via produto
    if ('stockQuantity' in data) throw new Error('O estoque não pode ser alterado pelo produto. Use Lotes.');
    
    // 5.2. Verifica se o produto existe
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new Error('Produto não encontrado.');
    }

    // 5.3. Validação de Code (Se mudou, verifica duplicidade)
    if (data.code && data.code !== existingProduct.code) {
      const codeTaken = await prisma.product.findUnique({
        where: { code: data.code }
      });
      if (codeTaken) {
        throw new Error('Novo código de barras já está em uso.');
      }
    }

    // 5.4. Validação de Categoria
    if (data.categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!categoryExists) {
        throw new Error('Nova categoria não encontrada ou inválida.');
      }
    }

    // 5.5. Validação de Fornecedor
    if (data.supplierId) {
        const supplierExists = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
        if (!supplierExists) {
            throw new Error('Novo fornecedor não encontrado ou inválido.');
        }
    }

    // 5.6. Atualização
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

  // --- 7. DELETAR PRODUTO ---
  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    // Regra 1: Não deixa deletar se houver estoque
    if (product.stockQuantity > 0) {
      throw new Error('Não é possível deletar um produto com estoque. Zere o estoque via Lotes.');
    }

    // Regra 2: Não deixa deletar se houver lotes vinculados (quando o model Batch existir)
    const batchesCount = await prisma.batch.count({ where: { productId: id } });
    if (batchesCount > 0) {
      throw new Error(`Não é possível deletar. Existem ${batchesCount} lotes vinculados a este produto.`);
    }  

    // Regra 3: Deleta o produto (não há dependências complexas ainda como vendas)
    await prisma.product.delete({ where: { id } });

    return { message: 'Produto removido com sucesso.' };
  }

  // Método auxiliar para processar a promoção ativa e calcular o preço
  private applyPromotionLogic(product: any) {
    const now = new Date();
    
    // Busca a primeira promoção que esteja ativa e dentro do prazo de validade
    const activePromo = product.promotions?.find((p: any) => {
      return p.isActive && now >= p.startDate && now <= p.endDate;
    });

    let promotionalPrice = null;

    if (activePromo) {
      const originalPrice = Number(product.price);
      const discount = Number(activePromo.discountValue);

      if (activePromo.discountType === 'PERCENTAGE') {
        promotionalPrice = originalPrice - (originalPrice * (discount / 100));
      } else {
        promotionalPrice = originalPrice - discount;
      }
    }

    // Retorna o produto com os novos campos virtuais para o Front
    return {
      ...product,
      promotionalPrice: promotionalPrice ? Number(promotionalPrice.toFixed(2)) : null,
      activePromotion: activePromo || null
    };
  }
}