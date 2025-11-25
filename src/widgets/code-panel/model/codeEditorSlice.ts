import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LANGUAGES, type LanguageValue } from "shared/config";
import { resetDuelSession } from "features/duel-session";
import { CodeEditorState } from "./types";

const initialState: CodeEditorState = {
    code: "",
    language: LANGUAGES.CPP,
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<{ code: string }>) => {
            state.code = action.payload.code;
        },
        setLanguage: (state, action: PayloadAction<{ language: LanguageValue }>) => {
            state.language = action.payload.language;
        },
    },

    extraReducers: (builder) => {
        builder.addCase(resetDuelSession, (state) => {
            state.code = initialState.code;
            state.language = initialState.language;
        });
    },
});

export const { setCode, setLanguage } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
