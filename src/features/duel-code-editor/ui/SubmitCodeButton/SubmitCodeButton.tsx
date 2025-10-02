import { selectCode } from "features/duel-code-editor/model/code-editor/selectors";
import { LANGUAGE_TO_LABELS } from "features/duel-code-editor/model/language-selector/languages";
import { selectLanguageValue } from "features/duel-code-editor/model/language-selector/selectors";
import { useSelector } from "react-redux";
import { IconButton } from "shared/ui";
import Submitcodeicon from "shared/assets/icons/submitCode.svg?react";

interface SubmitCodeButtonProps {
    className?: string;
    onSubmissionStart?: () => void;
    onSubmissionComplete?: () => void;
}

export const SubmitCodeButton = ({
    className = "",
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
        <div className={`submit-button ${className}`}>
            <IconButton
                onClick={handleSubmit}
                disabled={isCodeEmpty}
                className="submit-button__btn"
                title={isCodeEmpty ? "Please write some code first" : "Submit code for checking"}
            >
                <Submitcodeicon /> Отправить
            </IconButton>

            <div className="submit-button__info">
                <small>
                    Language: <strong>{LANGUAGE_TO_LABELS[language]}</strong>
                </small>
                <small>
                    Code length: <strong>{code.length}</strong> chars
                </small>
            </div>
        </div>
    );
};
