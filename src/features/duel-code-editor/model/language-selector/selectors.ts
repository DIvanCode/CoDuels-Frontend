import { createSelector } from "@reduxjs/toolkit";
import { LANGUAGE_TO_LABELS } from "./languages";

export const selectLanguageValue = (state: RootState) => state.languageSelector.value;

export const selectAvailableLanguages = (state: RootState) =>
    state.languageSelector.availableLanguages;

export const selectCurrentLanguageDetails = createSelector([selectLanguageValue], (value) => ({
    value,
    label: LANGUAGE_TO_LABELS[value],
}));
