import { prisma } from '../database/prisma';

// DTO para dados de entrada
interface CreateCategoryDTO {
  name: string;
  description?: string;
}

interface UpdateCategoryDTO {
  name?: string;
  description?: string;
}

export class CategoryService {
  
  // 1. CRIAR CATEGORIA
  async createCategory({ name, description }: CreateCategoryDTO) {
    // Regra: Nome da categoria deve ser único
    const categoryExists = await prisma.category.findUnique({
      where: { name }
    });

    if (categoryExists) {
      throw new Error('Categoria com este nome já existe.');
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    return category;
  }

  // 2. LISTAR TODAS AS CATEGORIAS
  async findAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  // 3. BUSCAR POR ID
  async findCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }

  // 4. ATUALIZAR CATEGORIA
  async updateCategory(id: string, { name, description }: UpdateCategoryDTO) {
    // 4.1 Verifica se a categoria existe
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      throw new Error('Categoria não encontrada.');
    }

    // 4.2 Se estiver mudando o nome, verifica se o novo nome já não está em uso
    if (name && name !== existingCategory.name) {
      const nameTaken = await prisma.category.findUnique({ where: { name } });
      if (nameTaken) {
        throw new Error('Este nome de categoria já está em uso.');
      }
    }

    // 4.3 Atualiza
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, description }
    });

    return updatedCategory;
  }

  // 5. DELETAR CATEGORIA
  async deleteCategory(id: string) {
    // 5.1 Verifica se a categoria existe
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    // 5.2 Regra de Negócio: Impede a exclusão se houver produtos vinculados
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      throw new Error(`Não é possível deletar. ${productsCount} produtos estão vinculados a esta categoria.`);
    }

    // 5.3 Deleta
    await prisma.category.delete({ where: { id } });

    return { message: 'Categoria removida com sucesso.' };
  }
}