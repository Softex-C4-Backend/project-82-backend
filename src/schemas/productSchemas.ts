import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  sku: z.string().min(3),
  category: z.string(),
  unit: z.string().min(1),
});