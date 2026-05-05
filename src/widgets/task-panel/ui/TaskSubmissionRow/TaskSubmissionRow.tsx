import { SubmissionItem } from "features/submit-code";
import { useNavigate } from "react-router-dom";
import { fromApiLanguage, LANGUAGE_LABELS } from "shared/config";
import { ResultTitle, Badge } from "shared/ui";
import { formatDate, getDisplayText, getVerdictVariant } from "../../lib/submissionUtils";

import styles from "./TaskSubmissionRow.module.scss";

interface SubmissionRowProps {
    submission: SubmissionItem;
    duelId: string;
    taskKey: string | null;
    showAuthor?: boolean;
    canOpenDetail?: boolean;
}

export const TaskSubmissionRow = ({
    submission,
    duelId,
    taskKey,
    showAuthor = false,
    canOpenDetail = true,
}: SubmissionRowProps) => {
    const navigate = useNavigate();
    const { status, verdict, message, language, created_at } = submission;
    const verdictValue = verdict ?? undefined;
    const languageLabel = language ? LANGUAGE_LABELS[fromApiLanguage(language)] : "—";

    const handleRowClick = () => {
        if (!canOpenDetail) return;

        const taskParam = taskKey ? `?task=${encodeURIComponent(taskKey)}` : "";
        navigate(`/duel/${duelId}/submissions/${submission.submission_id}${taskParam}`);
    };

    return (
        <tr
            onClick={handleRowClick}
            className={canOpenDetail ? styles.clickableRow : undefined}
            style={canOpenDetail ? { cursor: "pointer" } : undefined}
        >
            {showAuthor && <td>{submission.author?.nickname ?? "—"}</td>}
            <td>
                <ResultTitle variant={getVerdictVariant(verdictValue, status, message)}>
                    {getDisplayText(status, verdictValue, message)}
                </ResultTitle>
            </td>
            <td>{languageLabel}</td>
            <td className={styles.submissionDate}>
                {formatDate(created_at)}
                {submission.is_upsolving && <Badge severity="warning">после дуэли</Badge>}
            </td>
        </tr>
    );
};
