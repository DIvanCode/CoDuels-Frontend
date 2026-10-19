import { describe, expect, it, vi } from "vitest";
import type { Duel } from "entities/duel";
import { LANGUAGES } from "shared/config";
import { buildEditorPath, editorDraftsReducer } from "./editorDrafts";
import { resolveCodeEditorContent } from "./observerSolution";

vi.mock("shared/config", () => ({
    LANGUAGES: { CPP: "cpp", GO: "go", PYTHON: "python" },
    fromApiLanguage: (language: string) => {
        if (language === "Python") return "python";
        if (language === "Golang") return "go";
        return "cpp";
    },
}));

const editorPath = buildEditorPath(3, "42", "task-a", "my");
const drafts = editorDraftsReducer(
    {},
    { type: "code", path: editorPath, code: "unsent draft", appliedRevision: 0 },
);

const snapshot = (
    firstCode: string,
    firstLanguage: string,
    secondCode: string,
    secondLanguage: string,
): Duel =>
    ({
        id: 42,
        is_rated: false,
        should_show_opponent_solution: true,
        participants: null,
        status: "InProgress",
        start_time: "2026-01-01T00:00:00Z",
        deadline_time: "2026-01-01T01:00:00Z",
        rating_changes: null,
        tasks: null,
        solutions: {
            A: { solution: firstCode, language: firstLanguage },
            B: { solution: "first task B", language: "Golang" },
        },
        opponent_solutions: {
            A: { solution: secondCode, language: secondLanguage },
            B: { solution: "second task B", language: "Cpp" },
        },
    }) satisfies Duel;

const displayed = (duel: Duel, mode: "my" | "opponent", isParticipant: boolean, taskKey = "A") =>
    resolveCodeEditorContent({
        duel,
        taskKey,
        mode,
        isParticipant,
        drafts,
        editorPath,
        code: "persisted participant code",
        language: LANGUAGES.CPP,
        appliedRevision: 0,
    });

describe("duel code shown to an observer", () => {
    it("shows both participants from the latest successful duel snapshot", () => {
        const first = snapshot("first v1", "Cpp", "second v1", "Python");
        expect(displayed(first, "my", false)).toEqual({
            code: "first v1",
            language: LANGUAGES.CPP,
        });
        expect(displayed(first, "opponent", false)).toEqual({
            code: "second v1",
            language: LANGUAGES.PYTHON,
        });

        const updated = snapshot("first v2", "Golang", "second v2", "Cpp");
        expect(displayed(updated, "my", false)).toEqual({
            code: "first v2",
            language: LANGUAGES.GO,
        });
        expect(displayed(updated, "opponent", false)).toEqual({
            code: "second v2",
            language: LANGUAGES.CPP,
        });
    });

    it("uses each task's server code after switching tasks or reopening the page", () => {
        const duel = snapshot("first A", "Python", "second A", "Golang");

        expect(displayed(duel, "my", false, "B")).toEqual({
            code: "first task B",
            language: LANGUAGES.GO,
        });
        expect(displayed(duel, "opponent", false, "B")).toEqual({
            code: "second task B",
            language: LANGUAGES.CPP,
        });
        expect(displayed(duel, "my", false)).toEqual({
            code: "first A",
            language: LANGUAGES.PYTHON,
        });
    });

    it("does not replace a participant's unsent local draft", () => {
        const updated = snapshot("server update", "Python", "opponent", "Cpp");

        expect(displayed(updated, "my", true)).toEqual({
            code: "unsent draft",
            language: LANGUAGES.CPP,
        });
        expect(displayed(updated, "my", false)).toEqual({
            code: "server update",
            language: LANGUAGES.PYTHON,
        });
    });

    it("does not show the second participant while opponent visibility is disabled", () => {
        const hidden = {
            ...snapshot("first", "Cpp", "private second", "Python"),
            should_show_opponent_solution: false,
        };

        expect(displayed(hidden, "opponent", false)).toEqual({
            code: "",
            language: LANGUAGES.CPP,
        });
    });
});
