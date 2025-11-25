import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { baseEditorConfig, LANGUAGES } from "shared/config";
import { MonacoEditor } from "shared/ui";

import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";
import { selectDuelCode, selectDuelLanguage } from "widgets/code-panel/model/selector";
import { useDebouncedCallback } from "use-debounce";
import { DEBOUNCE_DELAY } from "widgets/code-panel/lib/consts";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";

function CodeEditor() {
    const { duelId } = useParams();

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const initialCode = useAppSelector((state) =>
        duelId ? selectDuelCode(state, Number(duelId)) : "",
    );

    const initialLanguage = useAppSelector((state) =>
        duelId ? selectDuelLanguage(state, Number(duelId)) : LANGUAGES.CPP,
    );

    const [localCode, setLocalCode] = useState<string>(initialCode);
    const [localLanguage, setLocalLanguage] = useState<LANGUAGES>(initialLanguage);

    const debouncedCodeCb = useDebouncedCallback(
        (code) => dispatch(setCode({ duelId: Number(duelId), code })),
        DEBOUNCE_DELAY,
    );

    const debouncedLanguageCb = useDebouncedCallback(
        (language) => dispatch(setLanguage({ duelId: Number(duelId), language })),
        DEBOUNCE_DELAY,
    );

    const onCodeChange = (code: string) => {
        setLocalCode(code);
        debouncedCodeCb(code);
    };

    const onLanguageChange = (language: LANGUAGES) => {
        setLocalLanguage(language);
        debouncedLanguageCb(language);
    };

    const onSubmissionStart = () => {
        if (duelId) navigate(`/duel/${duelId}/submissions`);
    };

    if (!duelId) return null;

    return (
        <div className={styles.codeEditor}>
            <EditorHeader
                code={localCode}
                language={localLanguage}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onSubmissionStart={onSubmissionStart}
                duelId={duelId}
            />

            <MonacoEditor
                height="100%"
                value={localCode}
                onValueChange={onCodeChange}
                language={localLanguage}
                theme="dark"
                options={baseEditorConfig}
                className={styles.editor}
            />
        </div>
    );
}

export default CodeEditor;
