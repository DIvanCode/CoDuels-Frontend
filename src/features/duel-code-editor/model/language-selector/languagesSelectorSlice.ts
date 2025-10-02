import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LANGUAGE_OPTIONS, LANGUAGES, LanguageValue } from "./languages";
import { LanguageSelectorState } from "./types";

const initialState: LanguageSelectorState = {
    value: LANGUAGES.CPP,
    availableLanguages: LANGUAGE_OPTIONS,
};

const LanguageSelectorSlice = createSlice({
    name: "languageSelector",
    initialState,
    reducers: {
        setLanguage: (state, action: PayloadAction<LanguageValue>) => {
            const availableValues = state.availableLanguages.map((lang) => lang.value);

            if (availableValues.includes(action.payload)) {
                state.value = action.payload;
            }
        },

        resetLanguage: (state) => {
            state.value = LANGUAGES.CPP;
        },
    },
});

export const { setLanguage, resetLanguage } = LanguageSelectorSlice.actions;
export default LanguageSelectorSlice.reducer;
