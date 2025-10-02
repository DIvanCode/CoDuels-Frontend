import { createSelector } from "@reduxjs/toolkit";
import { CodeEditorState } from "./types";
import { editor } from "monaco-editor";

export const selectCode = (state: { codeEditor: CodeEditorState }) => state.codeEditor.code;

export const selectTheme = (state: { codeEditor: CodeEditorState }) => state.codeEditor.theme;

export const selectFontSize = (state: { codeEditor: CodeEditorState }) => state.codeEditor.fontSize;

export const selectWordWrap = (state: { codeEditor: CodeEditorState }) => state.codeEditor.wordWrap;

export const selectMinimap = (state: { codeEditor: CodeEditorState }) => state.codeEditor.minimap;

export const selectIsEditorLoaded = (state: { codeEditor: CodeEditorState }) =>
    state.codeEditor.isLoaded;

export const selectEditorConfig = createSelector(
    [selectTheme, selectFontSize, selectWordWrap, selectMinimap],
    (theme, fontSize, wordWrap, minimap): editor.IStandaloneEditorConstructionOptions => ({
        theme,
        fontSize,
        wordWrap: wordWrap ? "on" : "off",
        minimap: { enabled: minimap },
    }),
);
