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
  AchievementTypeListResponseSchema,
  type AchievementListResponse,
  type AchievementObjectResponse,
  type EarnedAchievementSubListResponse,
  type AchievementTypeListResponse,
  type ScoresheetFormResponse,
} from "../types/achievement_schemas";
import {
  SessionObjectResponseSchema,
  type SessionObjectResponse,
  MonthListResponseSchema,
  type MonthListResponse,
} from "../types/session_schemas";
import {
  ParticipantListResponseSchema,
  LeagueWinnerListSchema,
  WinnerRoundInfoResponseSchema,
  type ParticipantListResponse,
  type LeagueWinnerList,
  type WinnerRoundInfoResponse,
} from "../types/participant_schemas";
import {
  PodObjectResponseSchema,
  PodsDateResponseSchema,
  type PodObjectResponse,
  type PodsDateResponse,
} from "../types/pod_schemas";
import {
  MetricSchema,
  EMPTY_METRIC,
  IndividualMetricResponseSchema,
  EMPTY_INDIVIDUAL_METRIC,
  type Metric,
  type IndividualMetricResponse,
  type BadgeResponse,
} from "../types/metric_schemas";
import {
  MonthRoundObjectResponseSchema,
  RoundListSchema,
  SignInResponseSchema,
  type MonthRoundObjectResponse,
  type RoundList,
  type SignInResponse,
  type StubRound,
} from "../types/round_schemas";
import {
  CommanderObjectResponseSchema,
  type CommanderObjectResponse,
} from "../types/commander_schemas";
import { type ConfigsTransformed } from "../types/config_schemas";
import { type GetDecklistsResponse } from "../types/decklist_schemas";
import { type DecklistParams } from "../routes/home/Decklists";

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
  getMetrics: builder.query<Metric, string | null>({
    query: (param = null) => `metrics/?period=${param}`,
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
    query: (id) => `metrics/participant/${id}/`,
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
        companions: [],
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
  getParticipantPods: builder.query<PodsDateResponse, Id>({
    query: (participant_id) => `get_participant_recent_pods/${participant_id}/`,
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(PodsDateResponseSchema, raw, []),
  }),
  getAchievementTypes: builder.query<AchievementTypeListResponse, void>({
    query: () => "get_achievement_types/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(AchievementTypeListResponseSchema, raw, []),
  }),
  getLeagueWinners: builder.query<LeagueWinnerList, void>({
    query: () => "get_league_winners/",
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(LeagueWinnerListSchema, raw, []),
  }),
  getLeagueWinner: builder.query<
    WinnerRoundInfoResponse,
    { mm_yy: string; participant_id: Id }
  >({
    query: ({ mm_yy, participant_id }) =>
      `get_league_winner/${mm_yy}/${participant_id}/`,
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(WinnerRoundInfoResponseSchema, raw, {
        participant_id: -1,
        rounds: [],
      }),
  }),
  getSignins: builder.query<SignInResponse, { round_one: Id; round_two: Id }>({
    query: ({ round_one, round_two }) =>
      `signin_counts/?round_one=${round_one}&round_two=${round_two}`,
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(SignInResponseSchema, raw, {}),
    providesTags: ["SignedIn"],
  }),
  getAllConfigs: builder.query<ConfigsTransformed, void>({
    query: () => "configs/all/",
    transformResponse: (res) => {
      const list = Array.isArray(res) ? res : [];
      const byKey = Object.fromEntries(list.map((c) => [c.key, c]));
      return { list, byKey };
    },
    providesTags: ["Configs"],
  }),
  getParticipantBadges: builder.query<BadgeResponse, { participant_id: Id }>({
    query: ({ participant_id }) => `badges/?participant_id=${participant_id}`,
  }),
  getPodParticipants: builder.query<
    { id: number; name: string }[],
    { pod_id: Id }
  >({
    query: ({ pod_id }) => `get_pod_participants/${pod_id}/`,
  }),
  getScoresheets: builder.query<
    ScoresheetFormResponse,
    { round_id: Id; pod_id: Id }
  >({
    query: ({ round_id, pod_id }) =>
      `rounds/${round_id}/pods/${pod_id}/scoresheet/`,
    providesTags: (result, error, { round_id, pod_id }) => [
      { type: "Scoresheet", id: `${round_id}-${pod_id}` },
    ],
  }),
  getRoundsBySession: builder.query<
    Record<string, StubRound>,
    { session_id: Id }
  >({
    query: ({ session_id }) => `get_rounds_by_session/${session_id}/`,
  }),
  getDecklists: builder.query<GetDecklistsResponse, void | DecklistParams>({
    query: (params) => {
      let paramList = [];
      let qParams = "";
      if (params?.colors || params?.colors === 0) {
        paramList.push(`colors=${params?.colors}`);
      }
      if (params?.sort_order) {
        paramList.push(`sort_order=${params?.sort_order}`);
      }

      if (paramList.length > 0) {
        qParams = `?${paramList.join("&")}`;
      }
      console.log(qParams);
      return `decklists/${qParams}`;
    },
    providesTags: ["Decklists"],
  }),
});
