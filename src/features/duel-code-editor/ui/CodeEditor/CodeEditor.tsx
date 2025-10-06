import { useDispatch, useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import {
    selectCode,
    selectEditorConfig,
    selectTheme,
} from "features/duel-code-editor/model/code-editor/selectors";
import { selectLanguageValue } from "features/duel-code-editor/model/language-selector/selectors";
import {
    setCode,
    setEditorLoaded,
} from "features/duel-code-editor/model/code-editor/codeEditorSlice";
import { initializeMonaco } from "../../../../shared/config";
import { defaultEditorOptions } from "shared/config/monaco/monaco";

interface CodeEditorProps {
    height?: string;
    className?: string;
}

export const CodeEditor = ({ height = "580px", className = "" }: CodeEditorProps) => {
    const dispatch = useDispatch();
    const code = useSelector(selectCode);
    const theme = useSelector(selectTheme);
    const language = useSelector(selectLanguageValue);
    const editorConfig = useSelector(selectEditorConfig);

    const handleEditorChange = (value: string | undefined) => {
        dispatch(setCode(value || ""));
    };

    const handleEditorDidMount = (_: any, monaco: any) => {
        initializeMonaco(monaco);
        dispatch(setEditorLoaded(true));

        monaco.editor.setTheme(theme);
    };

    return (
        <div className={`code-editor ${className}`}>
            <Editor
                height={height}
                language={language}
                theme={theme}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    ...defaultEditorOptions,
                    ...editorConfig,
                }}
                loading={<div className="editor-loading">Loading editor...</div>}
            />
        </div>
    );
};
