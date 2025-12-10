import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ThemeMode, ThemeState } from "./types";

const initialState: ThemeState = {
    mode: "dark",
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeMode>) => {
            state.mode = action.payload;
        },
        toggleTheme: (state) => {
            state.mode = state.mode === "dark" ? "light" : "dark";
        },
    },
});

export const themeActions = themeSlice.actions;
export default themeSlice.reducer;
