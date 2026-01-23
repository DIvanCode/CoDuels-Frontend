import { LANGUAGES } from "shared/config";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";

export const selectDuelCode = (state: RootState, duelId: number, taskId?: string | null) =>
    taskId ? (state.codeEditor.codeByTaskKey[buildDuelTaskKey(duelId, taskId)] ?? "") : "";

export const selectDuelLanguage = (state: RootState, duelId: number, taskId?: string | null) =>
    taskId
        ? state.codeEditor.languageByTaskKey[buildDuelTaskKey(duelId, taskId)] || LANGUAGES.CPP
        : LANGUAGES.CPP;

export const selectOpponentDuelCode = (state: RootState, duelId: number, taskId?: string | null) =>
    taskId ? (state.codeEditor.opponentCodeByTaskKey[buildDuelTaskKey(duelId, taskId)] ?? "") : "";

export const selectOpponentDuelLanguage = (
    state: RootState,
    duelId: number,
    taskId?: string | null,
) =>
    taskId
        ? state.codeEditor.opponentLanguageByTaskKey[buildDuelTaskKey(duelId, taskId)] ||
          LANGUAGES.CPP
        : LANGUAGES.CPP;
