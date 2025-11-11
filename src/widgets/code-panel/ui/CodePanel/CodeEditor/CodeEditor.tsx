import { useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LanguageValue } from "shared/config";
import { MonacoEditor } from "shared/ui";
import { editor } from "monaco-editor";
import {
    codeEditorInitialState,
    codeEditorReducer,
} from "widgets/code-panel/model/codeEditorReducer";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";

function CodeEditor() {
    const { duelId } = useParams();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(codeEditorReducer, codeEditorInitialState);

    const onCodeChange = (newCode: string) => {
        dispatch({ type: "SET_CODE", payload: newCode });
    };

    const onLanguageChange = (newLanguage: LanguageValue) => {
        dispatch({ type: "SET_LANGUAGE", payload: newLanguage });
    };

    const onSubmissionStart = () => {
        if (duelId) {
            navigate(`/duel/${duelId}/submissions`);
        }
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
