import { LANGUAGES } from "shared/config";

export const selectDuelCode = (state: RootState, duelId: number) =>
    state.codeEditor.codeByDuelId[duelId] ?? "";

export const selectDuelLanguage = (state: RootState, duelId: number) =>
    state.codeEditor.languageByDuelId[duelId] ?? LANGUAGES.CPP;
