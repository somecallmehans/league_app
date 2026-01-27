import { z } from "zod";
import { ColorSchema } from "./color_schemas";
import {
  ParticipantSchema,
  PodParticipantSchema,
  RoundParticipantStubSchema,
} from "./participant_schemas";

export const StubPodSchema = z.object({
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

export const UpsertEarnedWinnerInfoSchema = z.object({
  participant_id: z.number().nullable(),
  color_id: z.number().nullable(),
  commander_name: z.string(),
  pod_id: z.number(),
  session_id: z.number().optional(),
  addtl_info: z.object(z.unknown()).optional(),
});

export const UpsertEarnedWinInfoSchema = z.object({
  participant_id: z.number().optional(),
  slug: z.string().optional(),
  // TODO: When a round is a draw, we omit the top 2 keys but then ALWAYS
  // send deleted=True. This usually just no-ops on the backend, since existence
  // of a draw precludes a win record but might be worth cleaning up anyway.
  deleted: z.boolean().optional(),
});

const DeletePodParticipantRequestSchema = z.object({
  participant_id: z.number(),
  pod_id: z.number(),
});
const UpdatePodParticipantRequestSchema =
  DeletePodParticipantRequestSchema.extend({
    name: z.string().optional(),
    participant_id: z.number().optional(),
    round_id: z.number(),
  });

export type DeletePodParticipantRequest = z.infer<
  typeof DeletePodParticipantRequestSchema
>;
export type UpdatePodParticipantRequest = z.infer<
  typeof UpdatePodParticipantRequestSchema
>;
