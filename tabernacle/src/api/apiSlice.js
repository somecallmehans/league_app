import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";

import auth, { getTokenRaw } from "../helpers/authHelpers";
import getRoutes from "./getRoutes";
import postRoutes from "./postRoutes";
import authRoutes from "./authRoutes";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://127.0.0.1:8000/",
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
  tagTypes: ["Sessions", "Pods", "Participants", "Achievements", "Earned"],
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
  useGetAchievementsForSessionQuery,
  useGetSessionByDateQuery,
  useGetAchievementsForMonthQuery,
  useGetUniqueMonthsQuery,

  // POSTS
  usePostCreateSessionMutation,
  usePostBeginRoundMutation,
  usePostCloseRoundMutation,
  usePostRoundScoresMutation,
  usePostUpsertParticipantMutation,
  usePostUpsertAchievementsMutation,
  usePostUpsertEarnedMutation,

  // AUTH
  useLoginMutation,
  useRefreshMutation,
} = apiSlice;
