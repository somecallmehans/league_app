export default (builder) => ({
  getAchievements: builder.query({
    query: () => "achievements_restrictions/",
    providesTags: ["Achievements"],
  }),
  getAllSessions: builder.query({
    query: () => "all_sessions/",
    providesTags: ["Sessions"],
  }),
  getAllColors: builder.query({
    query: () => "colors/",
  }),
  getSessionByDate: builder.query({
    query: (params) => `sessions/${params}/`,
  }),
  getParticipants: builder.query({
    query: () => "participants/",
    providesTags: ["Participants"],
  }),
  getPods: builder.query({
    query: (params) => `pods/${params}/`,
    providesTags: ["Pods"],
  }),
  getAchievementsForSession: builder.query({
    query: (params) => `earned_for_session/${params}/`,
    providesTags: ["Earned"],
  }),
  getAchievementsForMonth: builder.query({
    query: (params) => `achievements_for_month/${params}/`,
  }),
  getUniqueMonths: builder.query({
    query: () => "unique_months/",
  }),
  getMetrics: builder.query({
    query: () => "metrics/",
  }),
  getPodsAchievements: builder.query({
    query: ({ pod }) => `pods_achievements/${pod}/`,
    providesTags: (result, error, { pod }) => [
      { type: "PodsAchievements", id: `$${pod}` },
    ],
  }),
  getAchievementRound: builder.query({
    query: ({ participant_id, round_id }) =>
      `get_participant_round_achievements/${participant_id}/${round_id}/`,
    providesTags: ["Earned"],
  }),
  getRoundsByMonth: builder.query({
    query: (params) => `rounds_by_month/${params}/`,
  }),
  getIndividualMetrics: builder.query({
    query: (params) => `metrics/${params}/`,
  }),
  getCommanders: builder.query({
    query: () => "commanders/",
  }),
  getRoundParticipants: builder.query({
    query: (round) => `round_participants/${round}/`,
    providesTags: ["Participants"],
  }),
});
