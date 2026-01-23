import { skipToken } from "@reduxjs/toolkit/query";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader, Table } from "shared/ui";
import { useGetSubmissionsQuery } from "features/submit-code";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { TaskSubmissionRow } from "../TaskSubmissionRow/TaskSubmissionRow";
import styles from "./TaskSubmissionsContent.module.scss";

export const TaskSubmissionsContent = () => {
    const { duelId } = useParams();
    const [searchParams] = useSearchParams();
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(Number(duelId!), {
        skip: !duelId,
    });
    const { selectedTaskKey } = useDuelTaskSelection(duel);
    const taskKeyFromQuery = searchParams.get("task");
    const resolvedTaskKey =
        taskKeyFromQuery ??
        selectedTaskKey ??
        (duel?.tasks ? Object.keys(duel.tasks).sort()[0] : null) ??
        (duel?.task_id ? "A" : null) ??
        "A";

    const submissionsArg = duelId
        ? {
              duelId,
              taskKey: resolvedTaskKey,
          }
        : skipToken;

    const {
        data: submissions,
        isLoading: isSubmissionsLoading,
        isError,
    } = useGetSubmissionsQuery(submissionsArg);

    if (isSubmissionsLoading || isDuelLoading) {
        return <Loader className={styles.centeredState} />;
    }

    if (isError || !submissions) {
        return <div>Ошибка при загрузке посылок</div>;
    }

    if (!duelId) {
        return <div>Ошибка: не указан ID дуэли</div>;
    }

    if (submissions.length === 0) {
        return (
            <div className={styles.centeredState}>
                <span className={styles.emptyStateText}>Посылок пока нет</span>
            </div>
        );
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
                    <TaskSubmissionRow
                        key={submission.submission_id}
                        submission={submission}
                        duelId={duelId}
                        taskKey={resolvedTaskKey}
                        afterDuelEnd={
                            submission?.created_at && duel?.end_time
                                ? new Date(submission.created_at) > new Date(duel.end_time)
                                : false
                        }
                    />
                ))}
            </tbody>
        </Table>
    );
};
