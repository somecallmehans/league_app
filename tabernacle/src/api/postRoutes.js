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
  postUpsertEarnedV2: builder.mutation({
    query: (body) => ({
      url: "upsert_earned_v2/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: (result, error, body) => [
      { type: "PodsAchievements", id: `${body.round_id}-${body.pod_id}` },
      "Pods",
      "Earned",
    ],
  }),
  postRerollPods: builder.mutation({
    query: (body) => ({
      url: "reroll_pods/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Pods", "Participants"],
  }),
  postInsertCommanders: builder.mutation({
    query: () => ({
      url: "fetch_new_commanders/",
      method: "POST",
    }),
  }),
  postUpsertParticipantAchievement: builder.mutation({
    query: (body) => ({
      url: "upsert_earned_achievements/",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ["Earned"],
  }),
});
