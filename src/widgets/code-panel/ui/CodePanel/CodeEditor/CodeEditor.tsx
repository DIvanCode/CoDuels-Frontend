import { useNavigate, useParams } from "react-router-dom";
import type { LanguageValue } from "shared/config";
import { baseEditorConfig } from "shared/config";
import { MonacoEditor } from "shared/ui";

import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";
import { selectCodeEditorCode, selectCodeEditorLanguage } from "widgets/code-panel/model/selector";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";

function CodeEditor() {
    const { duelId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // TODO: не забудь, что мутировать глобальный стейт плохо без дебаунса
    const code = useAppSelector(selectCodeEditorCode);
    const language = useAppSelector(selectCodeEditorLanguage);

    const onCodeChange = (newCode: string) => {
        if (duelId) {
            dispatch(setCode({ code: newCode }));
        }
    };

    const onLanguageChange = (newLanguage: LanguageValue) => {
        if (duelId) {
            dispatch(setLanguage({ language: newLanguage }));
        }
    };

    const onSubmissionStart = () => {
        if (duelId) {
            navigate(`/duel/${duelId}/submissions`);
        }
    };

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
                theme="dark"
                options={baseEditorConfig}
                className={styles.editor}
            />
        </div>
    );
}

export default CodeEditor;
