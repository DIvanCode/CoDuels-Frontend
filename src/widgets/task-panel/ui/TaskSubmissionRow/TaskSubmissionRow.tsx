import { SubmissionItem } from "features/submit-code";
import { useNavigate } from "react-router-dom";
import { fromApiLanguage, LANGUAGE_LABELS } from "shared/config";
import { ResultTitle, Badge } from "shared/ui";
import { formatDate, getDisplayText, getVerdictVariant } from "../../lib/submissionUtils";

import styles from "./TaskSubmissionRow.module.scss";

interface SubmissionRowProps {
    submission: SubmissionItem;
    duelId: string;
    afterDuelEnd: boolean;
    taskKey: string | null;
}

export const TaskSubmissionRow = ({
    submission,
    duelId,
    afterDuelEnd,
    taskKey,
}: SubmissionRowProps) => {
    const navigate = useNavigate();

    const { status, verdict, language, created_at } = submission;
    const verdictValue = verdict ?? undefined;
    const languageLabel = language ? LANGUAGE_LABELS[fromApiLanguage(language)] : "—";

    const handleRowClick = () => {
        const taskParam = taskKey ? `?task=${encodeURIComponent(taskKey)}` : "";
        navigate(`/duel/${duelId}/submissions/${submission.submission_id}${taskParam}`);
    };

    return (
        <tr onClick={handleRowClick} className={styles.clickableRow} style={{ cursor: "pointer" }}>
            <td>
                <ResultTitle variant={getVerdictVariant(verdictValue, status)}>
                    {getDisplayText(status, verdictValue)}
                </ResultTitle>
            </td>
            <td>{languageLabel}</td>
            <td className={styles.submissionDate}>
                {formatDate(created_at)}
                {afterDuelEnd && <Badge severity="warning">после дуэли</Badge>}
            </td>
        </tr>
    );
};
