import { SubmissionItem } from "features/submit-code";
import { useNavigate } from "react-router-dom";
import { ResultTitle } from "shared/ui";
import { formatDate, getDisplayText, getVerdictVariant } from "../../lib/submissionUtils";

import styles from "./TaskSubmissionRow.module.scss";

interface SubmissionRowProps {
    submission: SubmissionItem;
    duelId: string;
}

export const TaskSubmissionRow = ({ submission, duelId }: SubmissionRowProps) => {
    const navigate = useNavigate();

    const { status, verdict, language, created_at } = submission;

    const handleRowClick = () => {
        navigate(`/duel/${duelId}/submissions/${submission.submission_id}`);
    };

    return (
        <tr onClick={handleRowClick} className={styles.clickableRow} style={{ cursor: "pointer" }}>
            <td>
                <ResultTitle variant={getVerdictVariant(verdict, status)}>
                    {getDisplayText(status, verdict)}
                </ResultTitle>
            </td>
            <td>{language ?? "—"}</td>
            <td>{formatDate(created_at)}</td>
        </tr>
    );
};
