import { selectCode } from "features/duel-code-editor/model/code-editor/selectors";
import { LANGUAGE_TO_LABELS } from "features/duel-code-editor/model/language-selector/languages";
import { selectLanguageValue } from "features/duel-code-editor/model/language-selector/selectors";
import { useSelector } from "react-redux";
import { IconButton } from "shared/ui";
import Submitcodeicon from "shared/assets/icons/submitCode.svg?react";

import styles from "./SubmitCodeButton.module.scss";

interface SubmitCodeButtonProps {
    onSubmissionStart?: () => void;
    onSubmissionComplete?: () => void;
}

export const SubmitCodeButton = ({
    onSubmissionStart,
    onSubmissionComplete,
}: SubmitCodeButtonProps) => {
    const code = useSelector(selectCode);
    const language = useSelector(selectLanguageValue);

    const handleSubmit = async () => {
        onSubmissionStart?.();

        try {
            console.log("=== SENDING CODE TO SERVER ===");
            console.log("Language:", LANGUAGE_TO_LABELS[language]);
            console.log("Code length:", code.length, "characters");
            console.log("Code content:");
            console.log(code);
            console.log("==============================");

            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("✅ Code successfully sent to server!");

            alert(
                `Code submitted successfully!\nLanguage: ${LANGUAGE_TO_LABELS[language]}\nLength: ${code.length} chars`,
            );
        } catch (error) {
            console.error("❌ Error submitting code:", error);
            alert("Error submitting code. Please try again.");
        } finally {
            onSubmissionComplete?.();
        }
    };

    const isCodeEmpty = !code || code.trim().length === 0;

    return (
        <div>
            <IconButton
                className={styles.submitCodeButton}
                onClick={handleSubmit}
                disabled={isCodeEmpty}
                title={isCodeEmpty ? "Please write some code first" : "Submit code for checking"}
            >
                <Submitcodeicon /> Отправить
            </IconButton>
        </div>
    );
};
