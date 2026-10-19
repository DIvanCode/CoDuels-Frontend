import type { Duel } from "entities/duel";
import { fromApiLanguage, LANGUAGES } from "shared/config";
import { resolveEditorContent, type EditorDrafts, type EditorMode } from "./editorDrafts";

export const getObserverSolution = (
    duel: Duel | undefined,
    taskKey: string | null,
    mode: EditorMode,
) => {
    if (mode === "opponent" && !duel?.should_show_opponent_solution) {
        return { code: "", language: LANGUAGES.CPP };
    }

    const solutions = mode === "my" ? duel?.solutions : duel?.opponent_solutions;
    const solution = taskKey ? solutions?.[taskKey] : undefined;

    return {
        code: solution?.solution ?? "",
        language: solution ? fromApiLanguage(solution.language) : LANGUAGES.CPP,
    };
};

export const resolveCodeEditorContent = ({
    duel,
    taskKey,
    mode,
    isParticipant,
    drafts,
    editorPath,
    code,
    language,
    appliedRevision,
}: {
    duel: Duel | undefined;
    taskKey: string | null;
    mode: EditorMode;
    isParticipant: boolean;
    drafts: EditorDrafts;
    editorPath: string;
    code: string;
    language: LANGUAGES;
    appliedRevision: number;
}) =>
    isParticipant
        ? resolveEditorContent(drafts, editorPath, mode, code, language, appliedRevision)
        : getObserverSolution(duel, taskKey, mode);
