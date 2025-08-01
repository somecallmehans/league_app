import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";

import auth, { getTokenRaw } from "../helpers/authHelpers";
import getRoutes from "./getRoutes";
import postRoutes from "./postRoutes";
import authRoutes from "./authRoutes";

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

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "api/token/refresh/",
        method: "POST",
        body: { refresh: auth.getRefreshToken() },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      auth.setToken(refreshResult.data.access, auth.getRefreshToken());
      result = await baseQuery(args, api, extraOptions);
    } else {
      auth.removeToken();
      api.dispatch({ type: "auth/logout" });
    }
  }

  if (result.error) {
    toast.error(`Error while performing request: ${result?.error?.error}`);
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
  ],
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
  useGetSessionByDateQuery,
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

  // POSTS
  usePostCreateSessionMutation,
  usePostBeginRoundMutation,
  usePostCloseRoundMutation,
  usePostUpsertParticipantMutation,
  usePostUpsertAchievementsMutation,
  usePostUpsertEarnedV2Mutation,
  usePostRerollPodsMutation,
  usePostInsertCommandersMutation,
  usePostUpsertParticipantAchievementMutation,

  // AUTH
  useLoginMutation,
  useRefreshMutation,
} = apiSlice;
