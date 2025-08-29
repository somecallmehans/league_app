import type { ApiBuilder } from "./baseApiTypes";
import { safeParseWithFallback } from "../types/parse";
import {
  ColorsResponseSchema,
  type ColorsResponse,
} from "../types/color_schemas";
import {
  AchievementListResponseSchema,
  AchievementObjectResponseSchema,
  type AchievementListResponse,
  type AchievementObjectResponse,
} from "../types/achievement_schemas";
import {
  SessionObjectResponseSchema,
  type SessionObjectResponse,
  MonthListResponseSchema,
  type MonthListResponse,
} from "../types/session_schemas";
import {
  ParticipantListResponseSchema,
  type ParticipantListResponse,
} from "../types/participant_schemas";
import {
  PodObjectResponseSchema,
  type PodObjectResponse,
} from "../types/pod_schemas";
import {
  MetricSchema,
  EMPTY_METRIC,
  type Metric,
} from "../types/metric_schemas";

type Id = number | string;

export default (builder: ApiBuilder) => ({
  getAchievements: builder.query<AchievementObjectResponse, void>({
    query: () => "achievements_restrictions/",
    providesTags: ["Achievements"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(AchievementObjectResponseSchema, raw, {
        map: {},
        data: [],
        lookup: {},
        parents: [],
        points_set: [],
      }),
  }),
  getAchievementsList: builder.query<AchievementListResponse, void>({
    query: () => "get_achievements/",
    providesTags: ["Achievements"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(AchievementListResponseSchema, raw, []),
  }),
  getAllSessions: builder.query<SessionObjectResponse, void>({
    query: () => "all_sessions/",
    providesTags: ["Sessions"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(SessionObjectResponseSchema, raw, {}),
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
  getParticipants: builder.query<ParticipantListResponse, void>({
    query: () => "participants/",
    providesTags: ["Participants"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(ParticipantListResponseSchema, raw, []),
  }),
  getPods: builder.query<PodObjectResponse, Id>({
    query: (roundId) => `pods/${roundId}/`,
    providesTags: ["Pods"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(PodObjectResponseSchema, raw, {}),
  }),
  // TODO: Endpoint name is confusing as this returns a list of participants. Also
  // unsure why this is providing an Earned tag?
  getAchievementsForMonth: builder.query<ParticipantListResponse, string>({
    query: (mm_yy) => `achievements_for_month/${mm_yy}/`,
    providesTags: ["Earned"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(ParticipantListResponseSchema, raw, []),
  }),
  getUniqueMonths: builder.query<MonthListResponse, void>({
    query: () => "unique_months/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(MonthListResponseSchema, raw, []),
  }),
  getMetrics: builder.query<Metric, void>({
    query: () => "metrics/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(MetricSchema, raw, EMPTY_METRIC),
  }),
  getPodsAchievements: builder.query<unknown, { pod: Id }>({
    query: ({ pod }) => `pods_achievements/${pod}/`,
    providesTags: (result, error, { pod }) => [
      { type: "PodsAchievements", id: `$${pod}` },
    ],
  }),
  getAchievementRound: builder.query<
    unknown,
    { participant_id: Id; round_id: Id }
  >({
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
  getLeagueWinner: builder.query<
    unknown,
    { mm_yy: string; participant_id: Id }
  >({
    query: ({ mm_yy, participant_id }) =>
      `get_league_winner/${mm_yy}/${participant_id}/`,
  }),
});
