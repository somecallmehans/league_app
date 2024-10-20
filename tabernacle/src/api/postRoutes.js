export default (builder) => ({
  postCreateSession: builder.mutation({
    query: () => ({
      url: "sessions/new/",
      method: "POST",
    }),
    invalidatesTags: ["Sessions"],
  }),
  postBeginRound: builder.mutation({
    query: (body) => ({
      url: "begin_round/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Pods"],
  }),
  postCloseRound: builder.mutation({
    query: (body) => ({
      url: "close_round/",
      method: "POST",
      body: body,
    }),
  }),
  postRoundScores: builder.mutation({
    query: (body) => ({
      url: "submit_achievements/",
      method: "POST",
      body,
    }),
    invalidatesTags: ["Pods"],
  }),
  postUpsertParticipant: builder.mutation({
    query: (body) => ({
      url: "upsert_participant/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Participants"],
  }),
  postUpsertAchievements: builder.mutation({
    query: (body) => ({
      url: "upsert_achievements/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Achievements"],
  }),
  postUpsertEarned: builder.mutation({
    query: (body) => ({
      url: "upsert_earned/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Earned"],
  }),
});
