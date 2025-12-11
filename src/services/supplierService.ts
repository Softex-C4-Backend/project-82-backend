import { prisma } from '../database/prisma';

// DTO para Criação
interface CreateSupplierDTO {
  name: string;
  cnpj?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

// DTO para Atualização
interface UpdateSupplierDTO {
  name?: string;
  cnpj?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export class SupplierService {

  // --- 1. CRIAR FORNECEDOR ---
  async createSupplier(data: CreateSupplierDTO) {
    // 1.1. Validação de Nome (Regra: Nome é obrigatório e único)
    const nameExists = await prisma.supplier.findUnique({
      where: { name: data.name }
    });
    if (nameExists) {
      throw new Error('Já existe um fornecedor cadastrado com este nome.');
    }

    // 1.2. Validação de CNPJ (Se informado, verifica se já existe)
    if (data.cnpj) {
      const cnpjExists = await prisma.supplier.findFirst({
        where: { cnpj: data.cnpj }
      });
      if (cnpjExists) {
        throw new Error('CNPJ já cadastrado para outro fornecedor.');
      }
    }

    // 1.3. Criação
    const supplier = await prisma.supplier.create({
      data,
    });

    return supplier;
  }

  // --- 2. LISTAR TODOS OS FORNECEDORES ---
  async findAllSuppliers() {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },

      // Contagem de produtos para relatório
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Mapeamento (Data Transformation)
    // Aqui transformamos o "_count" feio do Prisma em um "productsCount"
    return suppliers.map(supplier => {
      return {
        ...supplier,
        productsCount: supplier._count.products, // Cria o campo melhor
        _count: undefined // Remove o campo _count do JSON final
      };
    });
  }

  // --- 3. BUSCAR FORNECEDOR POR ID ---
  async findSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      // Inclui a lista de produtos fornecidos
      include: {
        products: {
          select: { id: true, name: true, barcode: true }
        }
      }
    });
    if (!supplier) {
      throw new Error('Fornecedor não encontrado.');
    }
    return supplier;
  }

  // --- 4. ATUALIZAR FORNECEDOR ---
  async updateSupplier(id: string, data: UpdateSupplierDTO) {
    const existingSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!existingSupplier) {
      throw new Error('Fornecedor não encontrado.');
    }

    // 4.1. Validação de Nome (Se mudou, verifica duplicidade)
    if (data.name && data.name !== existingSupplier.name) {
      const nameTaken = await prisma.supplier.findUnique({ where: { name: data.name } });
      if (nameTaken) {
        throw new Error('Novo nome já está em uso por outro fornecedor.');
      }
    }

    // 4.2. Validação de CNPJ (Se mudou E não é nulo, verifica duplicidade)
    if (data.cnpj && data.cnpj !== existingSupplier.cnpj) {
      const cnpjTaken = await prisma.supplier.findFirst({ where: { cnpj: data.cnpj } });
      if (cnpjTaken) {
        throw new Error('Novo CNPJ já está em uso por outro fornecedor.');
      }
    }
    
    // 4.3. Atualização
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return updatedSupplier;
  }

  // --- 5. DELETAR FORNECEDOR ---
  async deleteSupplier(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new Error('Fornecedor não encontrado.');
    }

    // Regra Crítica: Impede a exclusão se houver produtos vinculados
    const productsCount = await prisma.product.count({
      where: { supplierId: id }
    });

    if (productsCount > 0) {
      throw new Error(`Não é possível deletar. ${productsCount} produtos estão vinculados a este fornecedor.`);
    }

    await prisma.supplier.delete({ where: { id } });

    return { message: 'Fornecedor removido com sucesso.' };
  }
}