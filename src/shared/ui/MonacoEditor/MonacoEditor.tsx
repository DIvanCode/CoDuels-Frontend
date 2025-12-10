import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { defaultEditorOptions, initializeMonaco } from "shared/config/monaco/monaco";
import clsx from "clsx";
import styles from "./MonacoEditor.module.scss";

interface Props {
    height: string;
    value: string;
    onValueChange: (value: string) => void;
    language: string;
    options: monaco.editor.IStandaloneEditorConstructionOptions;
    theme: string;
    className?: string;
    onEditorMount?: OnMount;
}

export const MonacoEditor = ({
    height,
    value,
    onValueChange,
    language,
    options,
    theme,
    className,
    onEditorMount,
}: Props) => {
    const monacoRef = useRef<typeof monaco | null>(null);

    const handleEditorChange = (value: string | undefined) => onValueChange(value ?? "");

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
        monacoRef.current = monacoInstance;

        initializeMonaco(monacoInstance);
        monacoInstance.editor.setTheme(theme);

        onEditorMount?.(editor, monacoInstance);
    };

    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(theme);
        }
    }, [theme]);

    return (
        <Editor
            height={height}
            language={language}
            className={clsx(styles.codeEditor, className)}
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
    );
};
