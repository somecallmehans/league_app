import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";

import auth, { getTokenRaw } from "../helpers/authHelpers";
import getRoutes from "./getRoutes";
import postRoutes from "./postRoutes";
import authRoutes from "./authRoutes";
import { BaseBQ } from "./baseApiTypes";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers) => {
    const token = getTokenRaw();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

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
    let msg = "Unknown error";

    if ("error" in result.error) {
      msg = result.error.error;
    } else {
      msg =
        typeof result.error.data === "string"
          ? result.error.data
          : JSON.stringify(result.error.data);
    }
    toast.error(`Error while performing request: ${msg}`);
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

  // POSTS
  usePostCreateSessionMutation,
  usePostBeginRoundMutation,
  usePostUpsertParticipantMutation,
  usePostUpsertAchievementsMutation,
  usePostUpsertEarnedV2Mutation,
  usePostRerollPodsMutation,
  usePostInsertCommandersMutation,
  usePostUpsertParticipantAchievementMutation,
  usePostSignupMutation,
  useUpdateConfigMutation,
  useDeleteLobbySignInMutation,
  usePostLobbySignInMutation,
  usePostPodParticipantMutation,
  useDeletePodParticipantMutation,

  // AUTH
  useLoginMutation,
  useRefreshMutation,
} = apiSlice;
