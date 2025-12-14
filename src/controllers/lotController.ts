import { Request, Response } from "express";
import { prisma } from "../database/prisma";

export const LotController = {
  async create(req: Request, res: Response) {
    try {
      const { code, quantity, expiration, productId } = req.body;

      const lot = await prisma.lot.create({
        data: {
          code,
          quantity,
          expiration: new Date(expiration),
          productId
        }
      });

      return res.status(201).json(lot);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return res.status(400).json({ error: message });
    }
  },

  async listByProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const lots = await prisma.lot.findMany({
        where: { productId }
      });

      return res.status(200).json(lots);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return res.status(400).json({ error: message });
    }
  }
};

