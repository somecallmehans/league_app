import { ApiBuilder } from "./baseApiTypes";

import { safeParseWithFallback } from "../types/parse";

import {
  BeginRoundRequestSchema,
  BeginRoundResponseSchema,
  type BeginRoundRequest,
  type BeginRoundResponse,
} from "../types/round_schemas";
import {
  SessionSchema,
  EMPTY_SESSION,
  type CreateSessionResponse,
} from "../types/session_schemas";
import {
  ParticipantSchema,
  UpsertParticipantRequestSchema,
  EMPTY_PARTICIPANT,
  type UpsertParticipantRequest,
  type UpsertParticipantResponse,
} from "../types/participant_schemas";
import {
  UpsertAchievementResponseSchema,
  EMPTY_ACHIEVEMENT_RESPONSE,
  UpsertEarnedRequest,
  UpsertEarnedResponse,
  type UpsertAchievementResponse,
  type UpsertAchievementRequest,
  type UpsertParticipantAchievementRequest,
} from "../types/achievement_schemas";
import {
  RerollPodsResponseSchema,
  type RerollPodsResponse,
  type RerollPodsRequest,
} from "../types/pod_schemas";

export default (builder: ApiBuilder) => ({
  postCreateSession: builder.mutation<CreateSessionResponse, void>({
    query: () => ({
      url: "sessions/new/",
      method: "POST",
    }),
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(SessionSchema, raw, EMPTY_SESSION),
    invalidatesTags: ["Sessions"],
  }),
  postBeginRound: builder.mutation<BeginRoundResponse, BeginRoundRequest>({
    query: (body) => {
      const parsed_body = BeginRoundRequestSchema.parse(body);
      return {
        url: "begin_round/",
        method: "POST",
        body: parsed_body,
      };
    },
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(BeginRoundResponseSchema, raw, []),
    invalidatesTags: ["Pods"],
  }),
  postUpsertParticipant: builder.mutation<
    UpsertParticipantResponse,
    UpsertParticipantRequest
  >({
    query: (body) => {
      const parsed_body = UpsertParticipantRequestSchema.parse(body);
      return {
        url: "upsert_participant/",
        method: "POST",
        body: parsed_body,
      };
    },
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(ParticipantSchema, raw, EMPTY_PARTICIPANT),
    invalidatesTags: ["Participants"],
  }),
  postUpsertAchievements: builder.mutation<
    UpsertAchievementResponse,
    UpsertAchievementRequest
  >({
    query: (body) => ({
      url: "upsert_achievements/",
      method: "POST",
      body: body,
    }),
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(
        UpsertAchievementResponseSchema,
        raw,
        EMPTY_ACHIEVEMENT_RESPONSE
      ),
    invalidatesTags: ["Achievements"],
  }),
  postUpsertEarnedV2: builder.mutation<
    UpsertEarnedResponse,
    UpsertEarnedRequest
  >({
    query: (body) => ({
      url: "upsert_earned_v2/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Pods", "Earned"],
  }),
  postRerollPods: builder.mutation<RerollPodsResponse, RerollPodsRequest>({
    query: (body) => ({
      url: "reroll_pods/",
      method: "POST",
      body: body,
    }),
    transformResponse: (raw: unknown) =>
      safeParseWithFallback(RerollPodsResponseSchema, raw, []),
    invalidatesTags: ["Pods", "Participants"],
  }),
  postInsertCommanders: builder.mutation<string, void>({
    query: () => ({
      url: "fetch_new_commanders/",
      method: "POST",
    }),
  }),
  postUpsertParticipantAchievement: builder.mutation<
    void,
    UpsertParticipantAchievementRequest
  >({
    query: (body) => ({
      url: "upsert_earned_achievements/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Earned"],
  }),
});
