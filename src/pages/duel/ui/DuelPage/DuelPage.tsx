import { useReducer } from "react";
import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import { CodeEditorProvider } from "widgets/code-panel/model/codeEditorContext";
import {
    codeEditorInitialState,
    codeEditorReducer,
} from "widgets/code-panel/model/codeEditorReducer";
import type { LanguageValue } from "shared/config";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    const [state, dispatch] = useReducer(codeEditorReducer, codeEditorInitialState);

    const setCode = (code: string) => dispatch({ type: "SET_CODE", payload: code });
    const setLanguage = (language: LanguageValue) =>
        dispatch({ type: "SET_LANGUAGE", payload: language });

    return (
        <CodeEditorProvider
            code={state.code}
            language={state.language}
            setCode={setCode}
            setLanguage={setLanguage}
        >
            <div className={styles.duelPage}>
                <CodePanel />
                <TaskPanel />
            </div>
        </CodeEditorProvider>
    );
};

export default DuelPage;
