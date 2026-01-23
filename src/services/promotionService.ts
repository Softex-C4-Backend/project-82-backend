import { prisma } from '../database/prisma';
import { DiscountType } from '@prisma/client';

interface CreatePromotionDTO {
  name: string;
  description?: string | null;
  discountType: DiscountType; // Usando o Enum do Prisma
  discountValue: number;
  startDate: Date | string;
  endDate: Date | string;
  productId: string;
}

interface UpdatePromotionDTO {
  name?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
}

export class PromotionService {
  // --- 1. CRIAR PROMOÇÃO ---
  async createPromotion(data: CreatePromotionDTO) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas.');
    }

    if (endDate <= startDate) {
      throw new Error('A data de término deve ser posterior à data de início.');
    }

    // Validação de sobreposição de datas
    const overlappingPromotion = await prisma.promotion.findFirst({
      where: {
        productId: data.productId,
        isActive: true,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlappingPromotion) {
      throw new Error('Já existe uma promoção ativa para este produto neste período.');
    }

    const productExists = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!productExists) {
      throw new Error('Produto não encontrado.');
    }

    return await prisma.promotion.create({
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  // --- 2. LISTAR PROMOÇÕES ---
  async listPromotions(productId?: string) {
    return await prisma.promotion.findMany({
      where: {
        ...(productId ? { productId } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- 3. OBTER DETALHES DA PROMOÇÃO ---
  async getPromotionById(id: string) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!promotion) {
      throw new Error('Promoção não encontrada.');
    }

    return promotion;
  }

  // --- 4. ATUALIZAR PROMOÇÃO ---
  async updatePromotion(id: string, data: UpdatePromotionDTO) {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Promoção não encontrada.');
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

    if (endDate <= startDate) {
      throw new Error('A data de término deve ser posterior à data de início.');
    }

    return await prisma.promotion.update({
      where: { id },
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  // --- 5. REMOVER PROMOÇÃO ---
  async deletePromotion(id: string) {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Promoção não encontrada.');
    }

    await prisma.promotion.delete({ where: { id } });
    return { message: 'Promoção removida com sucesso.' };
  }

  // --- 6. LISTAR PRODUTOS COM LOTES VENCENDO EM X DIAS ---
  async getExpiringProducts(days: number = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    const expiringBatches = await prisma.batch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        expirationDate: {
          lte: thresholdDate,
          gte: new Date(), // Apenas os que ainda não venceram
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            code: true,
          },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return expiringBatches;
  }
}