import { z } from "zod";
import { ColorSchema } from "./color_schemas";
import {
  ParticipantSchema,
  PodParticipantSchema,
  RoundParticipantStubSchema,
} from "./participant_schemas";

const StubPodSchema = z.object({
  id: z.number(),
  submitted: z.boolean(),
});

export const WinnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  deleted: z.boolean(),
  colors: ColorSchema.nullable().optional(),
  pods: StubPodSchema.nullable().optional(),
  participants: ParticipantSchema.nullable().optional(),
  round_points: z.number().nullable().optional(),
});

export const PodSchema = z.object({
  id: z.number(),
  submitted: z.boolean(),
  participants: z.array(PodParticipantSchema),
  winner_info: WinnerSchema.nullable().default(null),
});

export const PodObjectResponseSchema = z.record(z.string(), PodSchema);
export type PodObjectResponse = z.infer<typeof PodObjectResponseSchema>;

export const PodStubSchema = z.object({
  id: z.number(),
  round_number: z.number(),
  commander_name: z.string(),
  participants: z.array(RoundParticipantStubSchema),
});

const PodsDateResponseTuple = z.tuple([z.string(), z.array(PodStubSchema)]);
export const PodsDateResponseSchema = z.array(PodsDateResponseTuple);
export type PodsDateResponse = z.infer<typeof PodsDateResponseSchema>;
