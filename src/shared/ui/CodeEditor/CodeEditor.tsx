import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { OnMount } from "@monaco-editor/react";
import { defaultEditorOptions, initializeMonaco } from "shared/config/monaco/monaco";
import styles from "./CodeEditor.module.scss";

interface Props {
    height?: string;
    className?: string;
    value: string;
    onValueChange: (value: string) => void;
    language: string;
    theme?: string;
    options?: editor.IStandaloneEditorConstructionOptions;
    onEditorMount?: OnMount;
}

export const CodeEditor = ({
    height = "100%",
    value,
    onValueChange,
    language,
    theme = "vs-dark",
    options = {},
    onEditorMount,
}: Props) => {
    const monacoRef = useRef<any>(null);

    const handleEditorChange = (value: string | undefined) => {
        onValueChange(value || "");
    };

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        monacoRef.current = monaco;

        initializeMonaco(monaco);
        monaco.editor.setTheme(theme);

        onEditorMount?.(editor, monaco);
    };

    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(theme);
        }
    }, [theme]);

    return (
        <div className={styles.codeEditor}>
            <Editor
                height={height}
                language={language}
                theme={theme}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    ...defaultEditorOptions,
                    ...options,
                }}
                loading={<div>Loading editor...</div>}
            />
        </div>
    );
};
