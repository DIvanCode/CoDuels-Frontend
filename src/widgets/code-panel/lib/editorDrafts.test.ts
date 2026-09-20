import { describe, expect, it } from "vitest";
import type { LANGUAGES } from "shared/config";
import {
    buildEditorPath,
    editorDraftsReducer,
    resolveEditorContent,
    type EditorDrafts,
} from "./editorDrafts";

const cpp = "cpp" as LANGUAGES;
const python = "python" as LANGUAGES;

const ownA = buildEditorPath(1, "42", "task-a", "my");
const opponentA = buildEditorPath(1, "42", "task-a", "opponent");
const ownB = buildEditorPath(1, "42", "task-b", "my");
const otherUserA = buildEditorPath(2, "42", "task-a", "my");

describe("duel editor identity and unsent drafts", () => {
    it("keeps distinct models for tabs, tasks, duels, and users", () => {
        expect(
            new Set([ownA, opponentA, ownB, otherUserA, buildEditorPath(1, "43", "task-a", "my")])
                .size,
        ).toBe(5);
    });

    it("restores each unsent own-code draft after switching tasks and tabs", () => {
        let drafts: EditorDrafts = {};
        drafts = editorDraftsReducer(drafts, {
            type: "code",
            path: ownA,
            code: "unsent A",
            appliedRevision: 0,
        });
        drafts = editorDraftsReducer(drafts, {
            type: "language",
            path: ownA,
            language: python,
            appliedRevision: 0,
        });
        drafts = editorDraftsReducer(drafts, {
            type: "code",
            path: ownB,
            code: "unsent B",
            appliedRevision: 0,
        });

        expect(resolveEditorContent(drafts, ownB, "my", "server B", cpp, 0).code).toBe("unsent B");
        expect(resolveEditorContent(drafts, opponentA, "opponent", "opponent A", cpp, 0)).toEqual({
            code: "opponent A",
            language: cpp,
        });
        expect(resolveEditorContent(drafts, ownA, "my", "server A", cpp, 0)).toEqual({
            code: "unsent A",
            language: python,
        });
    });

    it("shows an applied submission immediately and does not revive the old draft", () => {
        let drafts: EditorDrafts = {};
        drafts = editorDraftsReducer(drafts, {
            type: "code",
            path: ownA,
            code: "unsent A",
            appliedRevision: 0,
        });
        drafts = editorDraftsReducer(drafts, {
            type: "language",
            path: ownA,
            language: python,
            appliedRevision: 0,
        });

        expect(resolveEditorContent(drafts, ownA, "my", "applied code", cpp, 1)).toEqual({
            code: "applied code",
            language: cpp,
        });

        drafts = editorDraftsReducer(drafts, {
            type: "language",
            path: ownA,
            language: python,
            appliedRevision: 1,
        });
        expect(resolveEditorContent(drafts, ownA, "my", "applied code", cpp, 1)).toEqual({
            code: "applied code",
            language: python,
        });
        expect(resolveEditorContent(drafts, ownA, "my", "applied code", cpp, 0)).toEqual({
            code: "applied code",
            language: cpp,
        });
    });

    it("does not expose an old user's draft after the editor remounts on logout", () => {
        const oldSession = editorDraftsReducer(
            {},
            { type: "code", path: ownA, code: "user 1", appliedRevision: 0 },
        );
        const newSession: EditorDrafts = {};

        expect(resolveEditorContent(oldSession, otherUserA, "my", "user 2", cpp, 0).code).toBe(
            "user 2",
        );
        expect(resolveEditorContent(newSession, ownA, "my", "", cpp, 0).code).toBe("");
    });

    it("restores the persisted own-code snapshot on reload without restoring opponent code", () => {
        const reloadedDrafts: EditorDrafts = {};

        expect(resolveEditorContent(reloadedDrafts, ownA, "my", "saved own", cpp, 0).code).toBe(
            "saved own",
        );
        expect(
            resolveEditorContent(reloadedDrafts, opponentA, "opponent", "fresh opponent", cpp, 0)
                .code,
        ).toBe("fresh opponent");
    });

    it("keeps unsent edits independent in two open tabs with the same editor identity", () => {
        const tabOne = editorDraftsReducer(
            {},
            { type: "code", path: ownA, code: "tab one", appliedRevision: 0 },
        );
        const tabTwo = editorDraftsReducer(
            {},
            { type: "code", path: ownA, code: "tab two", appliedRevision: 0 },
        );

        expect(resolveEditorContent(tabOne, ownA, "my", "saved", cpp, 0).code).toBe("tab one");
        expect(resolveEditorContent(tabTwo, ownA, "my", "saved", cpp, 0).code).toBe("tab two");
    });
});
