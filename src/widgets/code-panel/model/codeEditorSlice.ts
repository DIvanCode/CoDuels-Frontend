import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LanguageValue } from "shared/config";
import { authActions } from "features/auth";
import { CodeEditorState } from "./types";

const initialState: CodeEditorState = {
    codeByDuelId: {},
    languageByDuelId: {},
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<{ duelId: number; code: string }>) => {
            const { duelId, code } = action.payload;
            state.codeByDuelId[duelId] = code;
        },
        setLanguage: (
            state,
            action: PayloadAction<{ duelId: number; language: LanguageValue }>,
        ) => {
            const { duelId, language } = action.payload;
            state.languageByDuelId[duelId] = language;
        },
    },

    extraReducers: (builder) => {
        builder.addCase(authActions.logout, () => initialState);
    },
});

export const { setCode, setLanguage } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
