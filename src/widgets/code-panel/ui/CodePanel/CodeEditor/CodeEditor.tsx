import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { selectThemeMode } from "features/theme";
import { baseEditorConfig, LANGUAGES } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { MonacoEditor } from "shared/ui";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";
import { DEBOUNCE_DELAY } from "widgets/code-panel/lib/consts";
import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import { selectDuelCode, selectDuelLanguage } from "widgets/code-panel/model/selector";
import EditorHeader from "./EditorHeader/EditorHeader";
import styles from "./CodeEditor.module.scss";

function CodeEditor() {
    const { duelId } = useParams();

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Only duel participants can write and submit code
    const currentUser = useAppSelector(selectCurrentUser);
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(Number(duelId));
    const canEdit = !isDuelLoading && duel?.participants.some((p) => p.id === currentUser?.id);
    const { selectedTaskId, selectedTaskKey } = useDuelTaskSelection(duel);

    const initialCode = useAppSelector((state) =>
        duelId ? selectDuelCode(state, Number(duelId), selectedTaskId) : "",
    );

    const initialLanguage = useAppSelector((state) =>
        duelId ? selectDuelLanguage(state, Number(duelId), selectedTaskId) : LANGUAGES.CPP,
    );
    const theme = useAppSelector(selectThemeMode);

    const [localCode, setLocalCode] = useState<string>(initialCode);
    const [localLanguage, setLocalLanguage] = useState<LANGUAGES>(initialLanguage);

    const taskKey =
        duelId && selectedTaskId ? buildDuelTaskKey(Number(duelId), selectedTaskId) : null;

    const debouncedCodeCb = useDebouncedCallback(
        (code: string, key: string) => dispatch(setCode({ taskKey: key, code })),
        DEBOUNCE_DELAY,
    );

    const debouncedLanguageCb = useDebouncedCallback(
        (language: LANGUAGES, key: string) => dispatch(setLanguage({ taskKey: key, language })),
        DEBOUNCE_DELAY,
    );

    const onCodeChange = (code: string) => {
        setLocalCode(code);
        if (taskKey) {
            debouncedCodeCb(code, taskKey);
        }
    };

    const onLanguageChange = (language: LANGUAGES) => {
        setLocalLanguage(language);
        if (taskKey) {
            debouncedLanguageCb(language, taskKey);
        }
    };

    const onSubmissionStart = () => {
        if (!duelId) return;
        const nextParams = new URLSearchParams(location.search);
        if (selectedTaskKey) {
            nextParams.set("task", selectedTaskKey);
        }
        const search = nextParams.toString();
        navigate({
            pathname: `/duel/${duelId}/submissions`,
            search: search ? `?${search}` : "",
        });
    };

    useEffect(() => {
        setLocalCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        setLocalLanguage(initialLanguage);
    }, [initialLanguage]);

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
                taskKey={selectedTaskKey}
            />

            <MonacoEditor
                height="100%"
                value={localCode}
                onValueChange={onCodeChange}
                language={localLanguage}
                theme={theme}
                options={{ ...baseEditorConfig, readOnly: !canEdit }}
                className={styles.editor}
            />
        </div>
    );
}

export default CodeEditor;
