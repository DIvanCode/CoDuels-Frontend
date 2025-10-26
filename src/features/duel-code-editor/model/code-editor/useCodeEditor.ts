import { useState, useCallback } from "react";
import { editor } from "monaco-editor";

interface CodeEditorState {
    code: string;
    theme: "dark" | "light";
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
}

const initialState: CodeEditorState = {
    code: "",
    theme: "dark",
    fontSize: 14,
    wordWrap: true,
    minimap: true,
};

export const useCodeEditor = () => {
    const [state, setState] = useState<CodeEditorState>(initialState);

    const setCode = useCallback((code: string) => {
        setState((prev) => ({ ...prev, code }));
    }, []);

    const setTheme = useCallback((theme: "dark" | "light") => {
        setState((prev) => ({ ...prev, theme }));
    }, []);

    const setFontSize = useCallback((fontSize: number) => {
        setState((prev) => ({ ...prev, fontSize }));
    }, []);

    const toggleWordWrap = useCallback(() => {
        setState((prev) => ({ ...prev, wordWrap: !prev.wordWrap }));
    }, []);

    const toggleMinimap = useCallback(() => {
        setState((prev) => ({ ...prev, minimap: !prev.minimap }));
    }, []);

    const resetEditor = useCallback(() => {
        setState(initialState);
    }, []);

    const editorConfig: editor.IStandaloneEditorConstructionOptions = {
        theme: state.theme,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap ? "on" : "off",
        minimap: { enabled: state.minimap },
    };

    return {
        code: state.code,
        theme: state.theme,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap,
        minimap: state.minimap,
        editorConfig,
        setCode,
        setTheme,
        setFontSize,
        toggleWordWrap,
        toggleMinimap,
        resetEditor,
    };
};
