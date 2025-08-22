import { z } from "zod";

export const ColorSchema = z.object({
    id: z.number(),
    name: z.string(),
    symbol: z.string(),
    symbol_length: z.number().int().min(0).max(5),
    slug: z.string().nullable()
})

export type Color = z.infer<typeof ColorSchema>;

export const ColorsResponseSchema = z.object({
    list: z.array(ColorSchema),
    idObj: z.record(z.string(), ColorSchema),
    symbolObj: z.record(z.string(), z.number()),
  });
  
export type ColorsResponse = z.infer<typeof ColorsResponseSchema>;

