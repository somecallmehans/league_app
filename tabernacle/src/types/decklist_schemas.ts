import { z } from "zod";

export const IdSchema = z.number().int().positive();
export type Id = z.infer<typeof IdSchema>;

export const ScryfallImageSchema = z.object({
  url: z.string().url(),
  artist: z.string(),
});
export type ScryfallImage = z.infer<typeof ScryfallImageSchema>;

export const DecklistColorSchema = z.string();
export type DecklistColor = z.infer<typeof DecklistColorSchema>;

export const DecklistSummarySchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  url: z.string().min(1),
  participant_name: z.string().nullable(),
  code: z.string().min(1),

  commander_name: z.string().min(1),
  commander_img: z.array(ScryfallImageSchema).nullable().optional(),

  partner_name: z.string().nullable().optional(),
  partner_img: z.array(ScryfallImageSchema).nullable().optional(),

  companion_name: z.string().nullable().optional(),
  companion_img: z.array(ScryfallImageSchema).nullable().optional(),

  color: DecklistColorSchema,
  points: z.number().int().nonnegative(),
});

export type DecklistSummary = z.infer<typeof DecklistSummarySchema>;

export const GetDecklistsResponseSchema = z.array(DecklistSummarySchema);
export type GetDecklistsResponse = z.infer<typeof GetDecklistsResponseSchema>;

export const PostDecklistRequestSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),

  commander: IdSchema,
  partner: IdSchema.nullable().optional(),
  companion: IdSchema.nullable().optional(),

  achievements: z.array(IdSchema).optional(),
  give_credit: z.boolean().optional(),

  code: z.string(),
});

export type PostDecklistRequest = z.infer<typeof PostDecklistRequestSchema>;

export const PostDecklistResponseSchema = z.void();
export type PostDecklistResponse = z.infer<typeof PostDecklistResponseSchema>;
