import type { ApiBuilder } from "./baseApiTypes";
import { safeParseWithFallback } from "../types/parse";
import {
  ColorsResponseSchema,
  type ColorsResponse,
} from "../types/color_schemas";
import {
  AchievementListResponseSchema,
  AchievementObjectResponseSchema,
  PodAchievementResponse,
  PodAchievementResponseSchema,
  EMPTY_PODACHIEVEMENT,
  EarnedAchievementStubListResponseSchema,
  type AchievementListResponse,
  type AchievementObjectResponse,
  type EarnedAchievementSubListResponse,
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
  IndividualMetricResponseSchema,
  EMPTY_INDIVIDUAL_METRIC,
  type Metric,
  type IndividualMetricResponse,
} from "../types/metric_schemas";
import {
  MonthRoundObjectResponseSchema,
  RoundListSchema,
  type MonthRoundObjectResponse,
  type RoundList,
} from "../types/round_schemas";
import {
  CommanderObjectResponseSchema,
  type CommanderObjectResponse,
} from "../types/commander_schemas";

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
  getPodsAchievements: builder.query<PodAchievementResponse, { pod: Id }>({
    query: ({ pod }) => `pods_achievements/${pod}/`,
    providesTags: (result, error, { pod }) => [
      { type: "PodsAchievements", id: `$${pod}` },
    ],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(
        PodAchievementResponseSchema,
        raw,
        EMPTY_PODACHIEVEMENT
      ),
  }),
  getAchievementRound: builder.query<
    EarnedAchievementSubListResponse,
    { participant_id: Id; round_id: Id }
  >({
    query: ({ participant_id, round_id }) =>
      `get_participant_round_achievements/${participant_id}/${round_id}/`,
    providesTags: ["Earned"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(EarnedAchievementStubListResponseSchema, raw, []),
  }),
  getRoundsByMonth: builder.query<MonthRoundObjectResponse, string>({
    query: (mm_yy) => `rounds_by_month/${mm_yy}/`,
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(MonthRoundObjectResponseSchema, raw, {}),
  }),
  getIndividualMetrics: builder.query<IndividualMetricResponse, Id>({
    query: (id) => `metrics/${id}/`,
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(
        IndividualMetricResponseSchema,
        raw,
        EMPTY_INDIVIDUAL_METRIC
      ),
  }),
  getCommanders: builder.query<CommanderObjectResponse, void>({
    query: () => "commanders/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(CommanderObjectResponseSchema, raw, {
        commander_lookup: {},
        commanders: [],
        partners: [],
      }),
  }),
  getRoundParticipants: builder.query<ParticipantListResponse, Id>({
    query: (round) => `round_participants/${round}/`,
    providesTags: ["Participants"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(ParticipantListResponseSchema, raw, []),
  }),
  getAllRounds: builder.query<RoundList, { participant_id: Id }>({
    query: ({ participant_id }) => `get_all_rounds/${participant_id}/`,
    providesTags: ["Rounds"],
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(RoundListSchema, raw, []),
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
