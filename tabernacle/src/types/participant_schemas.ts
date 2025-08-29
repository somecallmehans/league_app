import { z } from "zod";

export const ParticipantSchema = z.object({
  id: z.number(),
  name: z.string(),
  total_points: z.number(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const ParticipantListResponseSchema = z.array(ParticipantSchema);

export type ParticipantListResponse = z.infer<
  typeof ParticipantListResponseSchema
>;

// Fodder for update, but the participant objects in the pods have a weird shape
export const PodParticipantSchema = z.object({
  participant_id: z.number(),
  name: z.string(),
  total_points: z.number(),
  round_points: z.number().nullable().optional(),
});
