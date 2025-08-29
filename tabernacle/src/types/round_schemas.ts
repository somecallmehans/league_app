import { z } from "zod";

export const RoundSchema = z.object({
  id: z.number(),
  round_number: z.union([z.literal(1), z.literal(2)]),
  deleted: z.boolean(),
  completed: z.boolean(),
});
export type Round = z.infer<typeof RoundSchema>;

export const MonthRoundSchema = z.object({
  session__id: z.number(),
  session__closed: z.boolean(),
  id: z.number(),
  round_number: z.number(),
  created_at: z.string(),
  completed: z.boolean(),
  started: z.boolean(),
});

export const MonthRoundObjectResponseSchema = z.record(
  z.string(),
  z.array(MonthRoundSchema)
);
export type MonthRoundObjectResponse = z.infer<
  typeof MonthRoundObjectResponseSchema
>;
