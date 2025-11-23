import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LANGUAGES, type LanguageValue } from "shared/config";

interface CodeForDuel {
    code: string;
    language: LanguageValue;
}

interface CodeEditorState {
    codesByDuelId: Record<string, CodeForDuel>;
}

const initialState: CodeEditorState = {
    codesByDuelId: {},
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<{ duelId: string; code: string }>) => {
            const { duelId, code } = action.payload;
            if (!state.codesByDuelId[duelId]) {
                state.codesByDuelId[duelId] = {
                    code: "",
                    language: LANGUAGES.CPP,
                };
            }
            state.codesByDuelId[duelId].code = code;
        },
        setLanguage: (
            state,
            action: PayloadAction<{ duelId: string; language: LanguageValue }>,
        ) => {
            const { duelId, language } = action.payload;
            if (!state.codesByDuelId[duelId]) {
                state.codesByDuelId[duelId] = {
                    code: "",
                    language: LANGUAGES.CPP,
                };
            }
            state.codesByDuelId[duelId].language = language;
        },
        clearCodeForDuel: (state, action: PayloadAction<string>) => {
            delete state.codesByDuelId[action.payload];
        },
        clearAllCodes: (state) => {
            state.codesByDuelId = {};
        },
    },
});

export const { setCode, setLanguage, clearCodeForDuel, clearAllCodes } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
