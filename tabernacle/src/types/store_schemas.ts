import { z } from "zod";

export const StoreListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  external_url: z.string().url(),
});

export const StoreListResponseSchema = z.array(StoreListItemSchema);

export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;
