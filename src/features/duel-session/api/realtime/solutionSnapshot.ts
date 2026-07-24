import type { Duel } from "entities/duel";
import { duelApiSlice } from "entities/duel";
import { LANGUAGES, toApiLanguage } from "shared/config";

import { buildDuelTaskKey } from "./codeEditorPort";
import type { SolutionSnapshot } from "./solutionPublisher";

const getSelectedTaskKey = (duel: Duel, search: string) => {
    const taskKeyFromQuery = new URLSearchParams(search).get("task") ?? "";

    if (duel.tasks && Object.keys(duel.tasks).length > 0) {
        const keys = Object.keys(duel.tasks).sort((a, b) => a.localeCompare(b));
        return keys.includes(taskKeyFromQuery) ? taskKeyFromQuery : keys[0];
    }

    return duel.task_id ? "A" : null;
};

const getSelectedTaskId = (duel: Duel, taskKey: string | null) => {
    if (!taskKey) return null;
    if (duel.tasks) return duel.tasks[taskKey]?.id ?? null;
    return duel.task_id ?? null;
};

export const selectSolutionSnapshot = (
    state: RootState,
    location: Pick<Location, "pathname" | "search">,
): SolutionSnapshot | null => {
    const duelIdFromPath = Number(location.pathname.match(/\/duel\/(\d+)/)?.[1] ?? NaN);
    const duelId =
        state.duelSession.activeDuelId ?? (Number.isFinite(duelIdFromPath) ? duelIdFromPath : null);
    if (!duelId) return null;

    const duel = duelApiSlice.endpoints.getDuel.select(duelId)(state)?.data ?? null;
    if (!duel?.should_show_opponent_solution || duel.status !== "InProgress") return null;
    if (!state.auth.user || !duel.participants?.some(({ id }) => id === state.auth.user?.id)) {
        return null;
    }

    const taskKey = getSelectedTaskKey(duel, location.search);
    const taskId = getSelectedTaskId(duel, taskKey);
    if (!taskKey || !taskId) return null;

    const editorKey = buildDuelTaskKey(duelId, taskId);
    const solution = state.codeEditor.codeByTaskKey[editorKey] ?? "";
    const language = state.codeEditor.languageByTaskKey[editorKey] ?? LANGUAGES.CPP;

    return {
        duelId,
        taskKey,
        solution,
        language: toApiLanguage(language),
    };
};
