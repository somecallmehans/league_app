export default (builder) => ({
  login: builder.mutation({
    query: (credentials) => ({
      url: "api/token/",
      method: "POST",
      body: credentials,
    }),
  }),
  refresh: builder.mutation({
    query: (token) => ({
      url: "api/token/refresh/",
      method: "POST",
      body: { refresh: token },
    }),
  }),
});
