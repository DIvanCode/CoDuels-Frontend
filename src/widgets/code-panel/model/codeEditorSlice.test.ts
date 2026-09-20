import { describe, expect, it, vi } from "vitest";

import type { LanguageValue } from "shared/config";
import reducer, { applySubmissionCode, setCode, setLanguage } from "./codeEditorSlice";

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

const duelFulfilled = (solution: string, language: string, opponentSolution = "opponent code") => ({
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
        state = reducer(
            state,
            setCode({
                taskKey: editorKey,
                code: "local draft",
                appliedRevision: 0,
                sessionEpoch: 0,
            }),
        );
        state = reducer(
            state,
            setLanguage({ taskKey: editorKey, language: go, appliedRevision: 0, sessionEpoch: 0 }),
        );

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

    it("clears both users' code on logout before a new session hydrates", () => {
        let state = reducer(undefined, duelFulfilled("user 1", "Cpp", "opponent 1"));
        state = reducer(state, { type: "auth/logout" });

        expect(state.codeByTaskKey[editorKey]).toBeUndefined();
        expect(state.opponentCodeByTaskKey[editorKey]).toBeUndefined();

        state = reducer(state, duelFulfilled("user 2", "Python", "opponent 2"));
        expect(state.codeByTaskKey[editorKey]).toBe("user 2");
        expect(state.opponentCodeByTaskKey[editorKey]).toBe("opponent 2");
    });

    it("applies code and language atomically and rejects delayed edits from before the apply", () => {
        let state = reducer(undefined, duelFulfilled("own draft", "Cpp"));
        state = reducer(
            state,
            applySubmissionCode({
                taskKey: editorKey,
                code: "applied submission",
                language: python,
            }),
        );
        expect(state.codeByTaskKey[editorKey]).toBe("applied submission");
        expect(state.languageByTaskKey[editorKey]).toBe(python);
        expect(state.appliedRevisionByTaskKey[editorKey]).toBe(1);

        state = reducer(
            state,
            setCode({
                taskKey: editorKey,
                code: "stale edit",
                appliedRevision: 0,
                sessionEpoch: 0,
            }),
        );
        state = reducer(
            state,
            setLanguage({ taskKey: editorKey, language: go, appliedRevision: 0, sessionEpoch: 0 }),
        );
        expect(state.codeByTaskKey[editorKey]).toBe("applied submission");
        expect(state.languageByTaskKey[editorKey]).toBe(python);

        state = reducer(
            state,
            setCode({ taskKey: editorKey, code: "new edit", appliedRevision: 1, sessionEpoch: 0 }),
        );
        expect(state.codeByTaskKey[editorKey]).toBe("new edit");
    });

    it("rejects delayed edits from a session that has logged out", () => {
        let state = reducer(undefined, duelFulfilled("user 1", "Cpp"));
        state = reducer(state, { type: "auth/logout" });
        state = reducer(
            state,
            setCode({ taskKey: editorKey, code: "old user", appliedRevision: 0, sessionEpoch: 0 }),
        );
        expect(state.codeByTaskKey[editorKey]).toBeUndefined();
        expect(state.sessionEpoch).toBe(1);
    });

    it("guards each task independently across repeated submission applies", () => {
        const otherTaskKey = "42:task-2";
        let state = reducer(undefined, duelFulfilled("own draft", "Cpp"));
        state = reducer(
            state,
            applySubmissionCode({ taskKey: editorKey, code: "first apply", language: python }),
        );
        state = reducer(
            state,
            applySubmissionCode({ taskKey: editorKey, code: "second apply", language: go }),
        );
        state = reducer(
            state,
            setCode({
                taskKey: editorKey,
                code: "stale after first",
                appliedRevision: 1,
                sessionEpoch: 0,
            }),
        );
        state = reducer(
            state,
            setCode({
                taskKey: otherTaskKey,
                code: "other task",
                appliedRevision: 0,
                sessionEpoch: 0,
            }),
        );

        expect(state.codeByTaskKey[editorKey]).toBe("second apply");
        expect(state.languageByTaskKey[editorKey]).toBe(go);
        expect(state.codeByTaskKey[otherTaskKey]).toBe("other task");
    });
});
