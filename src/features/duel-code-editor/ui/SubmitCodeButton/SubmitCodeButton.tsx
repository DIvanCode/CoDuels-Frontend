import { SubmitButton } from "shared/ui";
import Submitcodeicon from "shared/assets/icons/submit-code.svg?react";
import {
    useSubmitCodeMutation,
    useGetSubmissionDetailQuery,
} from "features/duel-code-editor/api/submitCodeApi";
import { useEffect, useState } from "react";
import { LanguageValue } from "features/duel-code-editor/model/language-selector/languages";

interface Props {
    code: string;
    language: LanguageValue;
    onSubmissionStart: () => void;
    onSubmissionComplete: (result?: { verdict: string; message?: string }) => void;
    duelId: string;
}

export const SubmitCodeButton = ({
    code,
    language,
    onSubmissionStart,
    onSubmissionComplete,
    duelId,
}: Props) => {
    const [submitCode, { isLoading: isSubmitting }] = useSubmitCodeMutation();
    const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<string>("");

    const { data: submissionDetail, error } = useGetSubmissionDetailQuery(
        { duelId, submissionId: currentSubmissionId! },
        { skip: !currentSubmissionId, pollingInterval: currentSubmissionId ? 2000 : 0 },
    );

    useEffect(() => {
        if (submissionDetail) {
            setCurrentStatus(submissionDetail.status);

            if (submissionDetail.status === "done") {
                onSubmissionComplete({
                    verdict: submissionDetail.verdict || "Unknown",
                    message:
                        submissionDetail.verdict === "Accepted"
                            ? "All tests passed successfully!"
                            : submissionDetail.verdict,
                });
                setCurrentSubmissionId(null);
            }
        }
    }, [submissionDetail]);

    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case "queued":
                return "В очереди";
            case "running":
                return "Тестирование";
            case "pending":
                return "В ожидании";
            case "done":
                return "Готово";
            default:
                return status;
        }
    };

    useEffect(() => {
        if (error) {
            console.error("Error fetching submission status:", error);
            setCurrentStatus("Error checking status");
            onSubmissionComplete({
                verdict: "Error",
                message: "Failed to check submission status",
            });
            setCurrentSubmissionId(null);
        }
    }, [error]);

    const handleSubmit = async () => {
        if (!duelId || duelId.trim().length === 0) {
            onSubmissionComplete({
                verdict: "Error",
                message: "Invalid duel ID",
            });
            return;
        }

        onSubmissionStart();
        setCurrentStatus("Submitting...");

        try {
            const cookies = document.cookie;

            const userIdMatch = cookies.match(/UserId=([^;]+)/);
            const userIdStr = userIdMatch ? userIdMatch[1].trim() : null;

            if (userIdStr === null) {
                throw Error("No user in cookies");
            }

            const submissionData = {
                user_id: userIdStr,
                solution: code,
                language: language,
            };

            const result = await submitCode({
                duelId,
                data: submissionData,
            }).unwrap();

            setCurrentSubmissionId(result.submission_id);
            setCurrentStatus("Queued");
        } catch (error) {
            console.error("Submission error:", error);
            setCurrentStatus("Submission failed");
            onSubmissionComplete({
                verdict: "Submission Error",
                message: "Failed to submit code. Please try again.",
            });
        }
    };

    const isCodeEmpty = !code || code.trim().length === 0;
    const isDisabled = isCodeEmpty || isSubmitting || currentSubmissionId !== null;

    const getButtonText = () => {
        if (isSubmitting) return "Отправка...";
        if (currentSubmissionId) {
            const translatedStatus = translateStatus(currentStatus);
            // Capitalize first letter
            return translatedStatus.charAt(0).toUpperCase() + translatedStatus.slice(1);
        }
        return "Отправить";
    };

    const getTitle = () => {
        if (isCodeEmpty) return "Напишите код сначала";
        if (isSubmitting) return "Отправка кода...";
        if (currentSubmissionId) {
            const translatedStatus = translateStatus(currentStatus);
            return translatedStatus.charAt(0).toUpperCase() + translatedStatus.slice(1);
        }
        return "Отправить код на проверку";
    };

    return (
        <SubmitButton
            variant="outlined"
            leadingIcon={<Submitcodeicon />}
            onClick={handleSubmit}
            disabled={isDisabled}
            title={getTitle()}
        >
            {getButtonText()}
        </SubmitButton>
    );
};
