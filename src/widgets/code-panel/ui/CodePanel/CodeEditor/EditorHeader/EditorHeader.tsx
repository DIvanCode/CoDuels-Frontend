import {
    LanguageSelector,
    FileLoader,
    SubmitCodeButton,
    LanguageValue,
} from "features/duel-code-editor";
import styles from "./EditorHeader.module.scss";

interface EditorHeaderProps {
    code: string;
    language: LanguageValue;
    onCodeChange: (code: string) => void;
    onLanguageChange: (language: LanguageValue) => void;
    duelId: string;
    onSubmissionStart: () => void;
    onSubmissionComplete: (result?: { verdict: string; message?: string }) => void;
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
    const handleFileLoaded = (content: string) => {
        onCodeChange(content);
    };

    return (
        <header className={styles.header}>
            <LanguageSelector value={language} onChange={onLanguageChange} />
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
