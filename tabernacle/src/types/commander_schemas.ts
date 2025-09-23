import { z } from "zod";

const Commander = z.object({
  id: z.number(),
  name: z.string(),
  colors_id: z.number(),
  has_partner: z.boolean(),
  is_background: z.boolean(),
});

export const CommanderObjectResponseSchema = z.object({
  commander_lookup: z.record(z.string(), Commander),
  commanders: z.array(Commander),
  partners: z.array(Commander),
});

export type CommanderObjectResponse = z.infer<
  typeof CommanderObjectResponseSchema
>;
