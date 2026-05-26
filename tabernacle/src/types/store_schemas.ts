import { z } from "zod";

export const StoreDetailSchema = z.object({
  name: z.string(),
  slug: z.string(),
  external_url: z.string().url(),
  is_active: z.boolean(),
});

export type StoreDetail = z.infer<typeof StoreDetailSchema>;

export const StoreListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  external_url: z.string().url(),
});

export const StoreListResponseSchema = z.array(StoreListItemSchema);

export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;
