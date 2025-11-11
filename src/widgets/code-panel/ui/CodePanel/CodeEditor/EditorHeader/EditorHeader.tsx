import { FileLoader, SubmitCodeButton } from "features/submit-code";
import { Select } from "shared/ui";
import { LANGUAGE_OPTIONS, type LanguageValue } from "shared/config";
import styles from "./EditorHeader.module.scss";

interface EditorHeaderProps {
    code: string;
    language: LanguageValue;
    onCodeChange: (code: string) => void;
    onLanguageChange: (language: LanguageValue) => void;
    onSubmissionStart: () => void;
    duelId: string;
}

export const EditorHeader = ({
    code,
    language,
    onCodeChange,
    onLanguageChange,
    duelId,
    onSubmissionStart,
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
                    duelId={duelId}
                />
            </div>
        </header>
    );
};

export default EditorHeader;
