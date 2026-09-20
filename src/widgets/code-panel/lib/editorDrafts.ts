import type { LANGUAGES } from "shared/config";

export type EditorMode = "my" | "opponent";

export type EditorDrafts = Record<
    string,
    { code?: string; language?: LANGUAGES; appliedRevision: number }
>;

export type EditorDraftAction =
    | { type: "code"; path: string; code: string; appliedRevision: number }
    | { type: "language"; path: string; language: LANGUAGES; appliedRevision: number };

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
        ...(drafts[action.path]?.appliedRevision === action.appliedRevision
            ? drafts[action.path]
            : {}),
        appliedRevision: action.appliedRevision,
        ...(action.type === "code" ? { code: action.code } : { language: action.language }),
    },
});

export const resolveEditorContent = (
    drafts: EditorDrafts,
    path: string,
    mode: EditorMode,
    code: string,
    language: LANGUAGES,
    appliedRevision: number,
) => {
    const draft =
        mode === "my" && drafts[path]?.appliedRevision === appliedRevision
            ? drafts[path]
            : undefined;
    return { code: draft?.code ?? code, language: draft?.language ?? language };
};
