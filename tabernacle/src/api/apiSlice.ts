import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { toast } from "react-toastify";

import auth, { getTokenRaw } from "../helpers/authHelpers";
import getRoutes from "./getRoutes";
import postRoutes from "./postRoutes";
import authRoutes from "./authRoutes";
import { BaseBQ } from "./baseApiTypes";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getTokenRaw();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

type MaybeRTKQError = FetchBaseQueryError | { error: string } | unknown;

export function getErrorMessage(err: MaybeRTKQError): string {
  if (!err) return "Unknown error";
  if (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    typeof (err as any).error === "string"
  ) {
    return (err as any).error;
  }

  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as any).data;

    if (typeof data === "string") return data;

    if (data?.detail) return data.detail;
    if (data?.message) return data.message;

    if (data?.errors) {
      try {
        return JSON.stringify(data.errors);
      } catch {
        return "Request failed with validation errors.";
      }
    }

    try {
      return JSON.stringify(data);
    } catch {
      return "Request failed.";
    }
  }

  return "Unknown error";
}

const baseQueryWithReauth: BaseBQ = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "api/token/refresh/",
        method: "POST",
        body: { refresh: auth.getRefreshToken() },
      },
      api,
      extraOptions
    );

    const refreshData = refreshResult.data as { access?: string } | undefined;

    if (refreshData) {
      auth.setToken(refreshData.access, auth.getRefreshToken());
      result = await baseQuery(args, api, extraOptions);
    } else {
      auth.removeToken();
      api.dispatch({ type: "auth/logout" });
    }
  }

  if (result?.error) {
    toast.error(getErrorMessage(result.error));
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Sessions",
    "Pods",
    "Participants",
    "Achievements",
    "Earned",
    "PodsAchievements",
    "Rounds",
    "SignedIn",
    "Configs",
    "Scoresheet",
    "Decklists",
  ] as const,
  endpoints: (builder) => ({
    ...getRoutes(builder),
    ...postRoutes(builder),
    ...authRoutes(builder),
  }),
});

export const {
  // GETS
  useGetAchievementsQuery,
  useGetAllSessionsQuery,
  useGetParticipantsQuery,
  useGetPodsQuery,
  useGetAllColorsQuery,
  useGetAchievementsForMonthQuery,
  useGetUniqueMonthsQuery,
  useGetMetricsQuery,
  useGetPodsAchievementsQuery,
  useGetAchievementRoundQuery,
  useGetRoundsByMonthQuery,
  useGetIndividualMetricsQuery,
  useGetCommandersQuery,
  useGetRoundParticipantsQuery,
  useGetAllRoundsQuery,
  useGetParticipantPodsQuery,
  useGetAchievementsListQuery,
  // Not currently in use but will be needed
  // when we add the crud for this
  // useGetAchievementTypesQuery,
  useGetLeagueWinnersQuery,
  useGetLeagueWinnerQuery,
  useGetSigninsQuery,
  useGetAllConfigsQuery,
  useGetParticipantBadgesQuery,
  useGetPodParticipantsQuery,
  useGetScoresheetsQuery,
  useGetRoundsBySessionQuery,
  useGetDecklistsQuery,
  useGetDecklistQuery,
  useLazyGetDecklistQuery,
  useVerifyDecklistSessionQuery,
  useGetParticipantDecklistsQuery,

  // POSTS
  usePostCreateSessionMutation,
  usePostBeginRoundMutation,
  usePostUpsertParticipantMutation,
  usePostUpsertAchievementsMutation,
  usePostInsertCommandersMutation,
  usePostUpsertParticipantAchievementMutation,
  usePostSignupMutation,
  useUpdateConfigMutation,
  useDeleteLobbySignInMutation,
  usePostLobbySignInMutation,
  usePostPodParticipantMutation,
  useDeletePodParticipantMutation,
  useInsertScoresheetMutation,
  useUpdateScoresheetMutation,
  usePostDecklistMutation,
  useExchangeTokensMutation,

  // AUTH
  useLoginMutation,
  useRefreshMutation,
} = apiSlice;
