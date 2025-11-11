import { SubmitButton } from "shared/ui";
import SubmitCodeIcon from "shared/assets/icons/submit-code.svg?react";
import { useSubmitCodeMutation } from "features/submit-code/api/submitCodeApi";
import type { LanguageValue } from "shared/config";
import { LANGUAGE_LABELS } from "shared/config";

interface Props {
    code: string;
    language: LanguageValue;
    onSubmissionStart: () => void;
    duelId: string;
}

export const SubmitCodeButton = ({ code, language, onSubmissionStart, duelId }: Props) => {
    const [submitCode, { isLoading: isSubmitting }] = useSubmitCodeMutation();

    const handleSubmit = async () => {
        onSubmissionStart();

        const submissionData = {
            solution: code,
            language: LANGUAGE_LABELS[language],
        };

        await submitCode({
            duelId,
            data: submissionData,
        }).unwrap();
    };

    const isCodeEmpty = !code || code.trim().length === 0;
    const isDisabled = isCodeEmpty || isSubmitting;

    return (
        <SubmitButton
            variant="outlined"
            leadingIcon={<SubmitCodeIcon />}
            onClick={handleSubmit}
            disabled={isDisabled}
        >
            Отправить
        </SubmitButton>
    );
};
