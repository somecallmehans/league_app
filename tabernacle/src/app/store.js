import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import achievementsReducer from "../routes/achievements/achievementsSlice";


export const store = configureStore({
  reducer: {
    achievements: achievementsReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
