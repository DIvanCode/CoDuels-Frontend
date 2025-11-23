import { useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LanguageValue } from "shared/config";
import { LANGUAGES } from "shared/config";
import { MonacoEditor } from "shared/ui";
import { editor } from "monaco-editor";
import {
    codeEditorInitialState,
    codeEditorReducer,
} from "widgets/code-panel/model/codeEditorReducer";
import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";

function CodeEditor() {
    const { duelId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [editorSettings] = useReducer(codeEditorReducer, codeEditorInitialState);

    const codeForDuel = useAppSelector((state) =>
        duelId ? state.codeEditor.codesByDuelId[duelId] : null,
    );

    const code = codeForDuel?.code ?? "";
    const language = codeForDuel?.language ?? LANGUAGES.CPP;

    const onCodeChange = (newCode: string) => {
        if (duelId) {
            dispatch(setCode({ duelId, code: newCode }));
        }
    };

    const onLanguageChange = (newLanguage: LanguageValue) => {
        if (duelId) {
            dispatch(setLanguage({ duelId, language: newLanguage }));
        }
    };

    const onSubmissionStart = () => {
        if (duelId) {
            navigate(`/duel/${duelId}/submissions`);
        }
    };

    const editorConfig = useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            theme: editorSettings.theme,
            fontSize: editorSettings.fontSize,
            wordWrap: editorSettings.wordWrap ? "on" : "off",
            minimap: { enabled: editorSettings.minimap },
        }),
        [
            editorSettings.theme,
            editorSettings.fontSize,
            editorSettings.wordWrap,
            editorSettings.minimap,
        ],
    );

    if (!duelId) return null;

    return (
        <div className={styles.codeEditor}>
            <EditorHeader
                code={code}
                language={language}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onSubmissionStart={onSubmissionStart}
                duelId={duelId}
            />
            <MonacoEditor
                height="100%"
                value={code}
                onValueChange={onCodeChange}
                language={language}
                theme={editorSettings.theme}
                options={editorConfig}
                className={styles.editor}
            />
        </div>
    );
}

export default CodeEditor;
