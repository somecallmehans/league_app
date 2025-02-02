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
    query: ({ round, pod }) => `pods_achievements/${round}/${pod}/`,
    providesTags: (result, error, { round, pod }) => [
      { type: "PodsAchievements", id: `${round}-${pod}` },
    ],
  }),
  getAchievementRound: builder.query({
    query: ({ participant_id, round_id }) =>
      `get_participant_round_achievements/${participant_id}/${round_id}/`,
    providesTags: ["Earned"],
  }),
});
