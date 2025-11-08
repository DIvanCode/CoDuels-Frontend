import { useParams } from "react-router-dom";
import { Loader, ResultTitle, Table } from "shared/ui";
import {
    useGetSubmissionsQuery,
    useGetSubmissionDetailQuery,
} from "widgets/task-panel/api/submissionsApi";
import { SubmissionItem } from "features/submit-code/ui/SubmitCodeButton/types";
import { POOLING_INTERVAL } from "features/submit-code/lib/consts";
import { useCodeEditor } from "widgets/code-panel/model/codeEditorContext";
import { LANGUAGES, type LanguageValue } from "shared/config";

import styles from "./TaskSubmissionsContent.module.scss";

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

const isTestingStatus = (status?: string, message?: string | null): boolean => {
    if (!status) return false;

    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "done") {
        return false;
    }

    if (normalizedStatus === "queued" || normalizedStatus === "running") {
        return true;
    }

    const normalizedMessage = message?.toLowerCase() || "";
    if (
        normalizedMessage.includes("compiled") ||
        normalizedMessage.includes("passed test") ||
        normalizedMessage.includes("testing") ||
        normalizedMessage.includes("running test")
    ) {
        return true;
    }

    return false;
};

const getVerdictVariant = (
    verdict?: string,
    status?: string,
    message?: string | null,
): "success" | "failure" | "testing" => {
    if (status === "Done" && verdict === "Accepted") {
        return "success";
    }

    if (isTestingStatus(status, message)) {
        return "testing";
    }

    return "failure";
};

const getDisplayText = (status?: string, verdict?: string, message?: string | null): string => {
    if (!status) return "—";

    if (status === "Queued") {
        return "Queued";
    }

    if (status === "Running") {
        return message || "Running";
    }

    if (status === "Done") {
        return verdict || "—";
    }

    return status;
};

const mapLanguageToLanguageValue = (language: string): LanguageValue => {
    const normalized = language.toLowerCase().trim();
    if (normalized === "c++" || normalized === "cpp") {
        return LANGUAGES.CPP;
    }
    if (normalized === "c#" || normalized === "csharp") {
        return LANGUAGES.CSHARP;
    }
    if (normalized === "python") {
        return LANGUAGES.PYTHON;
    }
    return LANGUAGES.CPP;
};

interface SubmissionRowProps {
    submission: SubmissionItem;
    duelId: string;
}

const SubmissionRow = ({ submission, duelId }: SubmissionRowProps) => {
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

    const codeEditor = useCodeEditor();

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        const isClickable = Boolean(
            submissionDetail?.solution && submissionDetail?.language && codeEditor,
        );
        if (isClickable) {
            e.preventDefault();
            codeEditor!.setCode(submissionDetail!.solution);
            codeEditor!.setLanguage(mapLanguageToLanguageValue(submissionDetail!.language));
        }
    };

    const isClickable = Boolean(
        submissionDetail?.solution && submissionDetail?.language && codeEditor,
    );

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
