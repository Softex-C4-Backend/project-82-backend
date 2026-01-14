import { prisma } from '../database/prisma';

interface CreatePromotionDTO {
  name: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_VALUE';
  discountValue: number;
  startDate: Date | string;
  endDate: Date | string;
  productId: string;
}

interface UpdatePromotionDTO {
  name?: string;
  description?: string | null;
  discountType?: 'PERCENTAGE' | 'FIXED_VALUE';
  discountValue?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
}

export class PromotionService {
  async createPromotion(data: CreatePromotionDTO) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas.');
    }

    if (endDate <= startDate) {
      throw new Error('A data de término deve ser posterior à data de início.');
    }

    // @ts-ignore
    const productExists = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!productExists) {
      throw new Error('Produto não encontrado.');
    }

    // @ts-ignore
    return await prisma.promotion.create({
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  async listPromotions(productId?: string) {
    // @ts-ignore
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

  async getPromotionById(id: string) {
    // @ts-ignore
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

  async updatePromotion(id: string, data: UpdatePromotionDTO) {
    // @ts-ignore
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Promoção não encontrada.');
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

    if (endDate <= startDate) {
      throw new Error('A data de término deve ser posterior à data de início.');
    }

    // @ts-ignore
    return await prisma.promotion.update({
      where: { id },
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  async deletePromotion(id: string) {
    // @ts-ignore
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Promoção não encontrada.');
    }

    // @ts-ignore
    await prisma.promotion.delete({ where: { id } });
    return { message: 'Promoção removida com sucesso.' };
  }

  async getExpiringProducts(days: number = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    // @ts-ignore
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
