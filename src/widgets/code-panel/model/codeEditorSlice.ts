import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Duel } from "entities/duel";
import { duelApiSlice } from "entities/duel";
import { fromApiLanguage, type LanguageValue } from "shared/config";
import { authActions } from "features/auth";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";
import { CodeEditorState } from "./types";

const getTaskIdByKey = (duel: Duel, taskKey: string) => {
    if (duel.tasks) {
        return duel.tasks[taskKey]?.id ?? null;
    }

    if (duel.task_id && taskKey === "A") {
        return duel.task_id;
    }

    return null;
};

const normalizeLanguage = (language?: string | null) => fromApiLanguage(language);

const initialState: CodeEditorState = {
    codeByTaskKey: {},
    languageByTaskKey: {},
    opponentCodeByTaskKey: {},
    opponentLanguageByTaskKey: {},
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<{ taskKey: string; code: string }>) => {
            const { taskKey, code } = action.payload;
            state.codeByTaskKey[taskKey] = code;
        },
        setOpponentCode: (
            state,
            action: PayloadAction<{ taskKey: string; code: string; language: LanguageValue }>,
        ) => {
            const { taskKey, code, language } = action.payload;
            state.opponentCodeByTaskKey[taskKey] = code;
            state.opponentLanguageByTaskKey[taskKey] = language;
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
        builder.addMatcher(duelApiSlice.endpoints.getDuel.matchFulfilled, (state, { payload }) => {
            if (!payload?.id) return;

            const applySolutions = (
                solutions:
                    | Record<
                          string,
                          { solution?: string | null; code?: string | null; language: string }
                      >
                    | null
                    | undefined,
                onApply: (taskKey: string, code: string, language: string) => void,
            ) => {
                if (!solutions) return;

                Object.entries(solutions).forEach(([taskKey, solution]) => {
                    const taskId = getTaskIdByKey(payload, taskKey);

                    if (!taskId) return;

                    const code = solution.solution ?? solution.code ?? "";
                    onApply(taskId, code, solution.language);
                });
            };

            applySolutions(payload.solutions, (taskId, code, language) => {
                const key = buildDuelTaskKey(payload.id, taskId);
                state.codeByTaskKey[key] = code;
                state.languageByTaskKey[key] = normalizeLanguage(language);
            });

            if (payload.should_show_opponent_solution) {
                applySolutions(payload.opponent_solutions, (taskId, code, language) => {
                    const key = buildDuelTaskKey(payload.id, taskId);
                    state.opponentCodeByTaskKey[key] = code;
                    state.opponentLanguageByTaskKey[key] = normalizeLanguage(language);
                });
            }
        });
    },
});

export const { setCode, setOpponentCode, setLanguage } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
