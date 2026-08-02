import { describe, expect, it, vi } from "vitest";

import type { LanguageValue } from "shared/config";
import reducer, { setCode, setLanguage } from "./codeEditorSlice";

vi.mock("shared/config", () => ({
    fromApiLanguage: (language?: string | null) => {
        const normalized = language?.toLowerCase();

        if (normalized === "python") return "python";
        if (normalized === "golang" || normalized === "go") return "go";

        return "cpp";
    },
}));

vi.mock("features/auth", () => {
    const logout = Object.assign(() => ({ type: "auth/logout" }), {
        type: "auth/logout",
    });

    return { authActions: { logout } };
});

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getDuel: {
                matchFulfilled: (action: { type?: string }) =>
                    action.type === "duel/getDuel/fulfilled",
            },
        },
    },
}));

const duelFulfilled = (
    solution: string,
    language: string,
    opponentSolution = "opponent code",
) => ({
    type: "duel/getDuel/fulfilled",
    payload: {
        id: 42,
        tasks: { A: { id: "task-1" } },
        solutions: { A: { solution, language } },
        opponent_solutions: {
            A: { solution: opponentSolution, language: "Python" },
        },
        should_show_opponent_solution: true,
    },
});

const editorKey = "42:task-1";
const go = "go" as LanguageValue;
const python = "python" as LanguageValue;

describe("code editor duel hydration", () => {
    it("hydrates code and language when the task has no local draft", () => {
        const state = reducer(undefined, duelFulfilled("server code", "Python"));

        expect(state.codeByTaskKey[editorKey]).toBe("server code");
        expect(state.languageByTaskKey[editorKey]).toBe(python);
    });

    it("keeps the local draft and language when duel polling returns stale solutions", () => {
        let state = reducer(undefined, duelFulfilled("initial server code", "Python"));
        state = reducer(state, setCode({ taskKey: editorKey, code: "local draft" }));
        state = reducer(state, setLanguage({ taskKey: editorKey, language: go }));

        state = reducer(state, duelFulfilled("stale server code", "Cpp"));

        expect(state.codeByTaskKey[editorKey]).toBe("local draft");
        expect(state.languageByTaskKey[editorKey]).toBe(go);
    });

    it("continues refreshing the server-owned opponent solution", () => {
        let state = reducer(undefined, duelFulfilled("own code", "Cpp", "opponent v1"));

        state = reducer(state, duelFulfilled("stale own code", "Python", "opponent v2"));

        expect(state.codeByTaskKey[editorKey]).toBe("own code");
        expect(state.opponentCodeByTaskKey[editorKey]).toBe("opponent v2");
        expect(state.opponentLanguageByTaskKey[editorKey]).toBe(python);
    });
});
