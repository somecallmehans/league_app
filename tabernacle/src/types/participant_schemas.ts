import { z } from "zod";

export const ParticipantSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  total_points: z.number().optional(),
  deleted: z.boolean().optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const EMPTY_PARTICIPANT: Participant = {
  id: -1,
  name: "",
  total_points: 0,
  deleted: false,
};

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

export const RoundParticipantStubSchema = z.object({
  id: z.number(),
  name: z.string(),
  winner: z.boolean(),
});

export const LeagueWinnerSchema = z.object({
  session__month_year: z.string(),
  participant_id: z.number(),
  participant_name: z.string(),
  total_points: z.number(),
  month_i: z.number(),
  year_i: z.number(),
  year_full: z.number(),
});
export type LeagueWinner = z.infer<typeof LeagueWinnerSchema>;

export const LeagueWinnerListSchema = z.array(LeagueWinnerSchema);
export type LeagueWinnerList = z.infer<typeof LeagueWinnerListSchema>;

const WinnerRoundInfoSchema = z.object({
  id: z.number(),
  round_number: z.number(),
  created_at: z.string(),
  total_points: z.number(),
  commander: z.string().nullable(),
  commander_img: z
    .array(z.object({ artist: z.string(), url: z.string() }))
    .nullable(),
});

export const WinnerRoundInfoResponseSchema = z.object({
  participant_id: z.number(),
  rounds: z.array(WinnerRoundInfoSchema),
});
export type WinnerRoundInfoResponse = z.infer<
  typeof WinnerRoundInfoResponseSchema
>;

// POST
export const UpsertParticipantRequestSchema = z.object({
  id: z.number().optional(),
  deleted: z.boolean().optional(),
  name: z.string(),
});
export type UpsertParticipantRequest = z.infer<
  typeof UpsertParticipantRequestSchema
>;
export type UpsertParticipantResponse = z.infer<typeof ParticipantSchema>;
