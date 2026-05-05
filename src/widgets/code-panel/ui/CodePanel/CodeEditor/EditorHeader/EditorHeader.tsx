import { SubmitCodeButton } from "features/submit-code";
import { Select } from "shared/ui";
import { LANGUAGE_LABELS, LANGUAGE_OPTIONS, type LanguageValue } from "shared/config";
import styles from "./EditorHeader.module.scss";

interface EditorHeaderProps {
    code: string;
    language: LanguageValue;
    onLanguageChange: (language: LanguageValue) => void;
    onSubmissionStart: () => void;
    duelId: string;
    taskKey?: string | null;
    readOnly?: boolean;
}

export const EditorHeader = ({
    code,
    language,
    onLanguageChange,
    duelId,
    onSubmissionStart,
    taskKey,
    readOnly = false,
}: EditorHeaderProps) => {
    return (
        <header className={styles.header}>
            {readOnly ? (
                <div className={styles.languageLabel}>{LANGUAGE_LABELS[language] ?? language}</div>
            ) : (
                <Select value={language} options={LANGUAGE_OPTIONS} onChange={onLanguageChange} />
            )}

            {!readOnly && (
                <div className={styles.buttons}>
                    <SubmitCodeButton
                        code={code}
                        language={language}
                        onSubmissionStart={onSubmissionStart}
                        duelId={duelId}
                        taskKey={taskKey}
                    />
                </div>
            )}
        </header>
    );
};

export default EditorHeader;
