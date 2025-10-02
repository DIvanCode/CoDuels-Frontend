import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CodeEditorState } from "./types";

const initialState: CodeEditorState = {
    code: "C++",
    theme: "dark",
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    isLoaded: false,
};

const codeEditorSlice = createSlice({
    name: "codeEditor",
    initialState,
    reducers: {
        setCode: (state, action: PayloadAction<string>) => {
            state.code = action.payload;
        },

        setTheme: (state, action: PayloadAction<"dark" | "light">) => {
            state.theme = action.payload;
        },

        setFontSize: (state, action: PayloadAction<number>) => {
            state.fontSize = action.payload;
        },

        toggleWordWrap: (state) => {
            state.wordWrap = !state.wordWrap;
        },

        toggleMinimap: (state) => {
            state.minimap = !state.minimap;
        },

        setEditorLoaded: (state, action: PayloadAction<boolean>) => {
            state.isLoaded = action.payload;
        },

        resetEditor: (state) => {
            state.code = initialState.code;
            state.theme = initialState.theme;
            state.fontSize = initialState.fontSize;
            state.wordWrap = initialState.wordWrap;
            state.minimap = initialState.minimap;
        },
    },
});

export const {
    setCode,
    setTheme,
    setFontSize,
    toggleWordWrap,
    toggleMinimap,
    setEditorLoaded,
    resetEditor,
} = codeEditorSlice.actions;

export default codeEditorSlice.reducer;
