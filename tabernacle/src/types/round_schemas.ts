import { z } from "zod";

import { ParticipantSchema } from "./participant_schemas";
import { StubPodSchema } from "./pod_schemas";

export const RoundSchema = z.object({
  id: z.number(),
  round_number: z.union([z.literal(1), z.literal(2)]),
  deleted: z.boolean().optional(),
  completed: z.boolean().optional(),
  created_at: z.string().optional(),
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

export const RoundListSchema = z.array(RoundSchema);
export type RoundList = z.infer<typeof RoundListSchema>;

// POST types
export const BeginRoundRequestSchema = z.object({
  round: z.number(),
  session: z.number(),
  participants: z.array(ParticipantSchema),
});
export type BeginRoundRequest = z.infer<typeof BeginRoundRequestSchema>;

export const BeginRoundResponseSchema = z.array(
  z.object({
    pods: StubPodSchema,
    participant_id: z.number(),
    name: z.string(),
    total_points: z.number(),
    round_points: z.number(),
  })
);
export type BeginRoundResponse = z.infer<typeof BeginRoundResponseSchema>;
