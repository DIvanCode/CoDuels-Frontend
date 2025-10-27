import { useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { codeEditorInitialState, codeEditorReducer, LanguageValue } from "features/submit-code";
import { MonacoEditor } from "shared/ui";
import { editor } from "monaco-editor";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";

function CodeEditor() {
    const { duelId } = useParams();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(codeEditorReducer, codeEditorInitialState);

    const onCodeChange = (newCode: string) => dispatch({ type: "SET_CODE", payload: newCode });

    const onLanguageChange = (newLanguage: LanguageValue) =>
        dispatch({ type: "SET_LANGUAGE", payload: newLanguage });

    const onSubmissionStart = () => {
        if (duelId) {
            navigate(`/duel/${duelId}/submissions`);
        }
    };

    const onSubmissionComplete = (result?: { verdict: string; message?: string }) => {
        alert("code result: " + result?.verdict);
    };

    const editorConfig = useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            theme: state.theme,
            fontSize: state.fontSize,
            wordWrap: state.wordWrap ? "on" : "off",
            minimap: { enabled: state.minimap },
        }),
        [state.theme, state.fontSize, state.wordWrap, state.minimap],
    );

    if (!duelId) return null;

    return (
        <div className={styles.codeEditor}>
            <EditorHeader
                code={state.code}
                language={state.language}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onSubmissionComplete={onSubmissionComplete}
                onSubmissionStart={onSubmissionStart}
                duelId={duelId}
            />
            <MonacoEditor
                height="100%"
                value={state.code}
                onValueChange={onCodeChange}
                language={state.language}
                theme={state.theme}
                options={editorConfig}
                className={styles.editor}
            />
        </div>
    );
}

export default CodeEditor;
