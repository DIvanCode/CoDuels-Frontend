import { useEffect, useLayoutEffect, useRef } from "react";
import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { defaultEditorOptions, initializeMonaco } from "shared/config/monaco/monaco";
import clsx from "clsx";
import { Loader } from "../Loader/Loader";
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
    path?: string;
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
    path,
}: Props) => {
    const monacoRef = useRef<typeof monaco | null>(null);
    const modelPathsRef = useRef(new Set<string>());
    const currentPathRef = useRef(path);
    const lastModelChangeRef = useRef(0);
    const hasPath = Boolean(path);

    useLayoutEffect(() => {
        if (path) lastModelChangeRef.current = Date.now();
    }, [path]);

    useEffect(() => {
        if (!hasPath) return;

        const handleCanceledModelWork = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            // Monaco can reject canceled work while switching models (microsoft/monaco-editor#5135).
            if (
                Date.now() - lastModelChangeRef.current < 1_000 &&
                reason instanceof Error &&
                reason.name === "Canceled" &&
                reason.message === "Canceled"
            ) {
                event.preventDefault();
            }
        };

        window.addEventListener("unhandledrejection", handleCanceledModelWork);
        return () => window.removeEventListener("unhandledrejection", handleCanceledModelWork);
    }, [hasPath]);

    useEffect(() => {
        currentPathRef.current = path;
        if (path) modelPathsRef.current.add(path);
    }, [path]);

    useEffect(
        () => () => {
            for (const modelPath of modelPathsRef.current) {
                if (modelPath !== currentPathRef.current) {
                    monacoRef.current?.editor.getModel(monaco.Uri.parse(modelPath))?.dispose();
                }
            }
        },
        [],
    );

    const handleEditorChange: OnChange = (value, event) => {
        if (event.isFlush) return;
        onValueChange(value ?? "");
    };

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
            path={path}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
                ...defaultEditorOptions,
                ...options,
            }}
            loading={
                <div className={styles.loadingState}>
                    <Loader />
                </div>
            }
        />
    );
};
