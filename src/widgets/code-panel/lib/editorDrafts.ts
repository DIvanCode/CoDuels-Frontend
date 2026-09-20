import type { LANGUAGES } from "shared/config";

export type EditorMode = "my" | "opponent";

export type EditorDrafts = Record<string, { code?: string; language?: LANGUAGES }>;

export type EditorDraftAction =
    | { type: "code"; path: string; code: string }
    | { type: "language"; path: string; language: LANGUAGES };

export const buildEditorPath = (
    userId: number | null | undefined,
    duelId: string | undefined,
    taskId: string | null,
    mode: EditorMode,
) =>
    `inmemory://duel/${userId ?? "viewer"}/${duelId ?? "unknown"}/${encodeURIComponent(taskId ?? "none")}/${mode}`;

export const editorDraftsReducer = (
    drafts: EditorDrafts,
    action: EditorDraftAction,
): EditorDrafts => ({
    ...drafts,
    [action.path]: {
        ...drafts[action.path],
        ...(action.type === "code" ? { code: action.code } : { language: action.language }),
    },
});

export const resolveEditorContent = (
    drafts: EditorDrafts,
    path: string,
    mode: EditorMode,
    code: string,
    language: LANGUAGES,
) => ({
    code: mode === "my" ? (drafts[path]?.code ?? code) : code,
    language: mode === "my" ? (drafts[path]?.language ?? language) : language,
});
