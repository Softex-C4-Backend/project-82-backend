import { z } from "zod";

export const createLotSchema = z.object({
  code: z.string().min(3),
  quantity: z.number().min(1),
  expiration: z.string().datetime(),
  productId: z.string().uuid(),
});