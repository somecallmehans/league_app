import { z } from "zod";

export const ParticipantSchema = z.object({
    id: z.number(),
    name: z.string(),
    total_points: z.number()
})

export type Participant = z.infer<typeof ParticipantSchema>;

export const ParticipantListResponseSchema = z.array(ParticipantSchema)

export type ParticipantListResponse = z.infer<typeof ParticipantListResponseSchema>