import { Button } from "shared/ui";
import SubmitCodeIcon from "shared/assets/icons/submit-code.svg?react";
import { useSubmitCodeMutation } from "features/submit-code/api/submitCodeApi";
import { selectCurrentUser } from "entities/user";
import { trackSubmitSolutionAction } from "features/anti-cheat";
import type { LanguageValue } from "shared/config";
import { toApiLanguage } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";

interface Props {
    code: string;
    language: LanguageValue;
    onSubmissionStart: () => void;
    duelId: string;
    taskKey?: string | null;
}

export const SubmitCodeButton = ({ code, language, onSubmissionStart, duelId, taskKey }: Props) => {
    const [submitCode, { isLoading: isSubmitting }] = useSubmitCodeMutation();
    const user = useAppSelector(selectCurrentUser);

    const handleSubmit = async () => {
        onSubmissionStart();

        const duelIdNumber = Number(duelId);
        if (Number.isFinite(duelIdNumber) && user?.id) {
            trackSubmitSolutionAction({
                duel_id: duelIdNumber,
                task_key: taskKey ?? "A",
                user_id: user.id,
            });
        }

        const submissionData = {
            solution: code,
            language: toApiLanguage(language),
            task_key: taskKey ?? "A",
        };

        await submitCode({
            duelId,
            data: submissionData,
            taskKey,
        }).unwrap();
    };

    const isCodeEmpty = !code || code.trim().length === 0;
    const isDisabled = isCodeEmpty || isSubmitting;

    return (
        <Button
            type="submit"
            variant="outlined"
            leadingIcon={<SubmitCodeIcon />}
            onClick={handleSubmit}
            disabled={isDisabled}
        >
            Отправить
        </Button>
    );
};
