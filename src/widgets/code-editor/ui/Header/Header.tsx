import { LanguageSelector } from "features/duel-code-editor/ui/LanguageSelector/LanguageSelector";
import styles from "./Header.module.scss";
import { FileLoader, SubmitCodeButton } from "features/duel-code-editor";

export const EditorHeader = () => {
    return (
        <header className={styles.header}>
            <LanguageSelector />
            <div className={styles.buttons}>
                <FileLoader />
                <SubmitCodeButton />
            </div>
        </header>
    );
};

export default EditorHeader;
