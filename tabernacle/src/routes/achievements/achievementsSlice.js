import { createSlice } from "@reduxjs/toolkit";

const achievementsSlice = createSlice({
  name: "achievements",
  initialState: [],
  reducers: {
    achievementsAdded(state, action) {
      state.push(action.achievements);
    },
  },
});

export const { achievementsAdded } = achievementsSlice.actions;
export default achievementsSlice.reducer;
