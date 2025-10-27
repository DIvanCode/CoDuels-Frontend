import {
    FileLoader,
    SubmitCodeButton,
    LanguageValue,
    LANGUAGE_OPTIONS,
} from "features/submit-code";
import { Select } from "shared/ui";
import styles from "./EditorHeader.module.scss";

interface EditorHeaderProps {
    code: string;
    language: LanguageValue;
    onCodeChange: (code: string) => void;
    onLanguageChange: (language: LanguageValue) => void;
    onSubmissionStart: () => void;
    onSubmissionComplete: (result?: { verdict: string; message?: string }) => void;
    duelId: string;
}

export const EditorHeader = ({
    code,
    language,
    onCodeChange,
    onLanguageChange,
    duelId,
    onSubmissionStart,
    onSubmissionComplete,
}: EditorHeaderProps) => {
    const handleFileLoaded = (content: string) => onCodeChange(content);

    return (
        <header className={styles.header}>
            <Select value={language} options={LANGUAGE_OPTIONS} onChange={onLanguageChange} />

            <div className={styles.buttons}>
                <FileLoader onFileLoaded={handleFileLoaded} />
                <SubmitCodeButton
                    code={code}
                    language={language}
                    onSubmissionStart={onSubmissionStart}
                    onSubmissionComplete={onSubmissionComplete}
                    duelId={duelId}
                />
            </div>
        </header>
    );
};

export default EditorHeader;
