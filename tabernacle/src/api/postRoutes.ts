import { z } from "zod";
import { ApiBuilder } from "./baseApiTypes";

import { safeParseWithFallback } from "../types/parse";

import {
  BeginRoundRequestSchema,
  BeginRoundResponseSchema,
  type BeginRoundRequest,
  type BeginRoundResponse,
  type SignInRequest,
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
import { type ConfigRequest } from "../types/config_schemas";

type POST_CREATE_SESSION_BODY = {
  session_date?: string;
};

export default (builder: ApiBuilder) => ({
  postCreateSession: builder.mutation<
    CreateSessionResponse,
    POST_CREATE_SESSION_BODY
  >({
    query: (body) => ({
      url: "sessions/new/",
      method: "POST",
      body,
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
  postSignup: builder.mutation<void, void>({
    query: (body) => ({
      url: "signup/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["SignedIn"],
  }),
  updateConfig: builder.mutation<void, ConfigRequest>({
    query: (body) => ({
      url: `configs/update/${body.key}/`,
      method: "POST",
      body: body.value,
    }),
    invalidatesTags: ["Configs"],
  }),
  // Different type of endpoint than the one above which requires
  // a code to id the player
  postLobbySignIn: builder.mutation<void, SignInRequest>({
    query: (body) => ({
      url: "post_signin/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["SignedIn"],
  }),
  deleteLobbySignIn: builder.mutation<void, SignInRequest>({
    query: (body) => ({
      url: "delete_signin/",
      method: "DELETE",
      body: body,
    }),
    invalidatesTags: ["SignedIn"],
  }),
});
