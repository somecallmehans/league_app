import type { ApiBuilder } from "./baseApiTypes";
import { safeParseWithFallback } from "../types/parse"
import { ColorsResponseSchema, type ColorsResponse} from "../types/color_schemas";
import { AchievementListResponseSchema, AchievementObjectResponseSchema,  type AchievementListResponse, type AchievementObjectResponse } from "../types/achievement_schemas"
import { SessionObjectResponseSchema, type SessionObjectResponse} from "../types/session_schemas"

type Id = number | string;

export default (builder: ApiBuilder) => ({
  getAchievements: builder.query<AchievementObjectResponse, void>({
    query: () => "achievements_restrictions/",
    providesTags: ["Achievements"],
    transformResponse: (raw: unknown) => safeParseWithFallback(AchievementObjectResponseSchema, raw, {map: {}, data: [], lookup: {}, parents: [], points_set: []})
  }),
  getAchievementsList: builder.query<AchievementListResponse, void>({
    query: () => "get_achievements/",
    providesTags: ["Achievements"],
    transformResponse: (raw: unknown) => safeParseWithFallback(AchievementListResponseSchema, raw, [])
  }),
  getAllSessions: builder.query<SessionObjectResponse, void>({
    query: () => "all_sessions/",
    providesTags: ["Sessions"],
    transformResponse: (raw: unknown) => safeParseWithFallback(SessionObjectResponseSchema, raw, {})
  }),
  getAllColors: builder.query<ColorsResponse, void>({
    query: () => "colors/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(ColorsResponseSchema, raw, {
        list: [],
        idObj: {},
        symbolObj: {},
      }),
  }),
  getSessionByDate: builder.query<unknown, string>({
    query: (mm_yy) => `sessions/${mm_yy}/`,
  }),
  getParticipants: builder.query<unknown, void>({
    query: () => "participants/",
    providesTags: ["Participants"],
  }),
  getPods: builder.query<unknown, Id>({
    query: (roundId) => `pods/${roundId}/`,
    providesTags: ["Pods"],
  }),
  getAchievementsForMonth: builder.query<unknown, string>({
    query: (mm_yy) => `achievements_for_month/${mm_yy}/`,
    providesTags: ["Earned"],
  }),
  getUniqueMonths: builder.query<unknown, void>({
    query: () => "unique_months/",
  }),
  getMetrics: builder.query<unknown, void>({
    query: () => "metrics/",
  }),
  getPodsAchievements: builder.query<unknown, { pod: Id }>({
    query: ({ pod }) => `pods_achievements/${pod}/`,
    providesTags: (result, error, { pod }) => [
      { type: "PodsAchievements", id: `$${pod}` },
    ],
  }),
  getAchievementRound: builder.query<unknown, { participant_id: Id; round_id: Id }>({
    query: ({ participant_id, round_id }) =>
      `get_participant_round_achievements/${participant_id}/${round_id}/`,
    providesTags: ["Earned"],
  }),
  getRoundsByMonth: builder.query<unknown, string>({
    query: (mm_yy) => `rounds_by_month/${mm_yy}/`,
  }),
  getIndividualMetrics: builder.query<unknown, Id>({
    query: (id) => `metrics/${id}/`,
  }),
  getCommanders: builder.query({
    query: () => "commanders/",
  }),
  getRoundParticipants: builder.query<unknown, Id>({
    query: (round) => `round_participants/${round}/`,
    providesTags: ["Participants"],
  }),
  getAllRounds: builder.query<unknown, { participant_id: Id }>({
    query: ({ participant_id }) => `get_all_rounds/${participant_id}/`,
    providesTags: ["Rounds"],
  }),
  getParticipantPods: builder.query<unknown, Id>({
    query: (participant_id) => `get_participant_recent_pods/${participant_id}/`,
  }),
  getAchievementTypes: builder.query<unknown, void>({
    query: () => "get_achievement_types/",
  }),
  getLeagueWinners: builder.query<unknown, void>({
    query: () => "get_league_winners/",
  }),
  getLeagueWinner: builder.query<unknown, {mm_yy: string, participant_id: Id}>({
    query: ({ mm_yy, participant_id }) =>
      `get_league_winner/${mm_yy}/${participant_id}/`,
  }),
});
