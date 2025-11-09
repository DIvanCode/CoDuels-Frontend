import { useParams, useNavigate } from "react-router-dom";
import { Loader, ResultTitle, Table } from "shared/ui";
import {
    useGetSubmissionsQuery,
    useGetSubmissionDetailQuery,
} from "widgets/task-panel/api/submissionsApi";
import { SubmissionItem } from "features/submit-code/ui/SubmitCodeButton/types";
import { POOLING_INTERVAL } from "features/submit-code/lib/consts";
import {
    formatDate,
    getDisplayText,
    getVerdictVariant,
} from "widgets/task-panel/lib/submissionUtils";

import styles from "./TaskSubmissionsContent.module.scss";

interface SubmissionRowProps {
    submission: SubmissionItem;
    duelId: string;
}

const SubmissionRow = ({ submission, duelId }: SubmissionRowProps) => {
    const navigate = useNavigate();
    const initialStatus = submission.status?.toLowerCase();
    const isDone = initialStatus === "done";

    const { data: submissionDetail } = useGetSubmissionDetailQuery(
        { duelId, submissionId: String(submission.submission_id) },
        {
            pollingInterval: !isDone ? POOLING_INTERVAL : 0,
        },
    );

    const status = submissionDetail?.status || submission.status;
    const verdict = submissionDetail?.verdict || submission.verdict;
    const message = submissionDetail?.message;
    const displayLanguage = submissionDetail?.language || "—";
    const displayDate = submissionDetail?.submit_time || submission.created_at;

    const displayText = getDisplayText(status, verdict, message);
    const variant = getVerdictVariant(verdict, status, message);

    const handleRowClick = () => {
        navigate(`/duel/${duelId}/submissions/${submission.submission_id}`);
    };

    const isClickable = Boolean(submissionDetail?.solution && submissionDetail?.language);

    return (
        <tr
            onClick={handleRowClick}
            className={isClickable ? styles.clickableRow : undefined}
            style={{ cursor: isClickable ? "pointer" : "default" }}
        >
            <td>
                <ResultTitle variant={variant}>{displayText}</ResultTitle>
            </td>
            <td>{displayLanguage}</td>
            <td>{formatDate(displayDate)}</td>
        </tr>
    );
};

export const TaskSubmissionsContent = () => {
    const { duelId } = useParams<{ duelId: string }>();
    const {
        data: submissions,
        isLoading,
        isError,
    } = useGetSubmissionsQuery(duelId ?? "", {
        skip: !duelId,
    });

    if (isLoading) {
        return <Loader />;
    }

    if (isError || !submissions) {
        return <div>Ошибка при загрузке посылок</div>;
    }

    if (submissions.length === 0) {
        return <div>Посылок пока нет</div>;
    }

    if (!duelId) {
        return <div>Ошибка: не указан ID дуэли</div>;
    }

    const sortedSubmissions = [...submissions].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
    });

    return (
        <Table className={styles.submissionsTable}>
            <thead>
                <tr>
                    <th>Статус</th>
                    <th>Язык</th>
                    <th>Время отправки</th>
                </tr>
            </thead>

            <tbody>
                {sortedSubmissions.map((submission) => (
                    <SubmissionRow
                        key={submission.submission_id}
                        submission={submission}
                        duelId={duelId}
                    />
                ))}
            </tbody>
        </Table>
    );
};
