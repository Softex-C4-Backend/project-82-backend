import { prisma } from '../database/prisma';

// DTO para Criação
interface CreateBatchDTO {
  productId: string;
  code?: string | null;
  receivedDate?: Date | string | null;
  expirationDate: Date | string;
  initialQuantity: number;
  unitCost: number;
}

// DTO para Atualização (Campos opcionais)
interface UpdateBatchDTO {
  code?: string | null;
  receivedDate?: Date | string | null;
  expirationDate?: Date | string;
  unitCost?: number;
}

export class BatchService {
  // --- 1. CRIAR LOTE ---
  async createBatch(data: CreateBatchDTO) {
    // 1.1. valida quantidade
    if (!Number.isInteger(data.initialQuantity) || data.initialQuantity <= 0) {
      throw new Error('A quantidade inicial do lote deve ser um inteiro maior que 0.');
    }

    const receivedDate = data.receivedDate ? new Date(data.receivedDate) : null;
    const expirationDate = new Date(data.expirationDate);

    // 1.2. valida datas
    if (receivedDate && Number.isNaN(receivedDate.getTime())) {
      throw new Error('Data de recebimento inválida.');
    }

    // 1.3. valida data de vencimento
    if (Number.isNaN(expirationDate.getTime())) {
      throw new Error('Data de vencimento inválida.');
    }

    // 1.4. Criação
    const batch = await prisma.$transaction(async (tx) => {
    // 1.5. Validação de Produto (Regra de Negócio: Deve existir)
    const productExists = await tx.product.findUnique({ where: { id: data.productId } });
    if (!productExists) throw new Error('Produto não encontrado ou inválido.');

    const created = await tx.batch.create({
        data: {
        productId: data.productId,
        code: data.code ?? null,
        receivedDate,
        expirationDate,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        unitCost: data.unitCost,
        },
    });

    // 1.6. Atualiza o estoque do produto
    await tx.product.update({
        where: { id: data.productId },
        data: { 
            stockQuantity: { increment: data.initialQuantity },
            cost: data.unitCost // Define o novo custo de referência baseado nesta entrada
        },
    });

    return created;
    });

    return batch;
  }

  // --- 2. LISTAR LOTES ---
  async findAllBatches(productId?: string){
    // (opcional) valida se o produto existe quando vier productId
    if (productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!productExists) throw new Error('Produto não encontrado ou inválido.');
    }

    const batches = await prisma.batch.findMany({
      where: {
        ...(productId ? { productId } : {}),
        currentQuantity: { gt: 0 },        
      },
      orderBy: { expirationDate: 'asc' },
      include: {
        product: {
          select: {
             id: true,
             name: true,
             code: true,
             unitOfMeasure: true,
             stockQuantity: true,
          },
        },
      },
    });

    return batches;
  }

  // --- 3. BUSCAR LOTE POR ID ---
  async findBatchById(id: string) {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        product: {
          select: {
             id: true,
             name: true,
             code: true,
             unitOfMeasure: true,
             stockQuantity: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('Lote não encontrado.');
    }

    return batch;
  }

  // --- 4. ATUALIZAR LOTE ---
  async updateBatch(id: string, data: UpdateBatchDTO) {
    // 4.1. Verifica se o lote existe
    const existingBatch = await prisma.batch.findUnique({ where: { id } });
    if (!existingBatch) {
      throw new Error('Lote não encontrado.');
    }

    // 4.2. Converte/define datas (permite limpar receivedDate com null)
    const receivedDate =
    data.receivedDate !== undefined
      ? (data.receivedDate === null ? null : new Date(data.receivedDate))
      : existingBatch.receivedDate;

  const expirationDate =
    data.expirationDate !== undefined
      ? new Date(data.expirationDate)
      : existingBatch.expirationDate;

    // 4.3. valida datas
    if (data.receivedDate !== undefined && data.receivedDate !== null) {
      if (Number.isNaN(receivedDate!.getTime())) throw new Error('Data de recebimento inválida.');
    }

    if (data.expirationDate !== undefined) {
      if (Number.isNaN(expirationDate.getTime())) throw new Error('Data de vencimento inválida.');
    }
    

    // 4.4. valida custo unitário
    if (data.unitCost !== undefined && data.unitCost <= 0) {
      throw new Error('O custo unitário do lote deve ser um valor positivo.');
    }

    // 4.5. Atualização
    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: {
          ...data,
          receivedDate,
          expirationDate,
      },
    });

    return updatedBatch;
  }

  // --- 5. DELETAR LOTE ---
  async deleteBatch(id: string) {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new Error('Lote não encontrado.');
    }

    // Regra: não deixa deletar lote que já teve movimentação/baixa
    if (batch.currentQuantity !== batch.initialQuantity) {
        throw new Error('Não é possível deletar um lote que já teve movimentação.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.batch.delete({ where: { id } });

      await tx.product.update({
        where: { id: batch.productId },
        data: { stockQuantity: { decrement: batch.initialQuantity } },
      });
    });

    return { message: 'Lote removido com sucesso.' };
  }
}