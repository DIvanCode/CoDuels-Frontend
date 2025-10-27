import { SubmitButton } from "shared/ui";
import SubmitCodeIcon from "shared/assets/icons/submit-code.svg?react";
import {
    useSubmitCodeMutation,
    useGetSubmissionDetailQuery,
} from "features/submit-code/api/submitCodeApi";
import { useEffect, useState } from "react";
import { LanguageValue } from "features/submit-code/model/languages";
import { POOLING_INTERVAL } from "features/submit-code/lib/consts";

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

    const { data: submissionDetail, error } = useGetSubmissionDetailQuery(
        { duelId, submissionId: currentSubmissionId! },
        { skip: !currentSubmissionId, pollingInterval: currentSubmissionId ? POOLING_INTERVAL : 0 },
    );

    // TODO: Вообще, флоу, как на coderun опять же: ты кликаешь на отправку посылки, тебя переносит на список посылок, и среди этого списка обновляется твоя
    // Причем почитай про нормализацию данных, чтобы каждый раз все не фетчить, и про теги в редаксе (может инвалидация тегов понадобится)
    // А тут получается результат в самой кнопке. Может, это как заглушка, хз, но лучше еще раз напомнить
    useEffect(() => {
        if (submissionDetail) {
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

    useEffect(() => {
        if (error) {
            console.error("Error fetching submission status:", error);
            onSubmissionComplete({
                verdict: "Error",
                message: "Failed to check submission status",
            });
            setCurrentSubmissionId(null);
        }
    }, [error]);
    // ----------

    const handleSubmit = async () => {
        onSubmissionStart();

        const submissionData = {
            solution: code,
            language: language,
        };

        const result = await submitCode({
            duelId,
            data: submissionData,
        }).unwrap();

        setCurrentSubmissionId(result.submission_id);
    };

    const isCodeEmpty = !code || code.trim().length === 0;
    const isDisabled = isCodeEmpty || isSubmitting || currentSubmissionId !== null;

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
