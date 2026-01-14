import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LanguageValue } from "shared/config";
import { authActions } from "features/auth";
import { CodeEditorState } from "./types";

const initialState: CodeEditorState = {
    codeByTaskKey: {},
    languageByTaskKey: {},
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<{ taskKey: string; code: string }>) => {
            const { taskKey, code } = action.payload;
            state.codeByTaskKey[taskKey] = code;
        },
        setLanguage: (
            state,
            action: PayloadAction<{ taskKey: string; language: LanguageValue }>,
        ) => {
            const { taskKey, language } = action.payload;
            state.languageByTaskKey[taskKey] = language;
        },
    },

    extraReducers: (builder) => {
        builder.addCase(authActions.logout, () => initialState);
    },
});

export const { setCode, setLanguage } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
