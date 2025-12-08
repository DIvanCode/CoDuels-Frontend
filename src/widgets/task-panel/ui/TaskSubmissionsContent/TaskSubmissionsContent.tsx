import { useParams } from "react-router-dom";
import { Loader, Table } from "shared/ui";
import { useGetSubmissionsQuery, POOLING_INTERVAL } from "features/submit-code";

import { useEffect, useState } from "react";
import { useGetDuelQuery } from "entities/duel";
import { TaskSubmissionRow } from "../TaskSubmissionRow/TaskSubmissionRow";
import styles from "./TaskSubmissionsContent.module.scss";

export const TaskSubmissionsContent = () => {
    const { duelId } = useParams();
    const [shouldPollSubmissions, setShouldPollSubmissions] = useState(true);

    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(Number(duelId!), {
        skip: !duelId,
    });

    const {
        data: submissions,
        isLoading: isSubmissionsLoading,
        isError,
    } = useGetSubmissionsQuery(duelId ?? "", {
        skip: !duelId,
        pollingInterval: shouldPollSubmissions ? POOLING_INTERVAL : 0,
    });

    useEffect(() => {
        if (submissions?.every((s) => s.status === "Done") || isError) {
            setShouldPollSubmissions(false);
        } else {
            setShouldPollSubmissions(true);
        }
    }, [submissions, isError]);

    if (isSubmissionsLoading || isDuelLoading) {
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
                    <TaskSubmissionRow
                        key={submission.submission_id}
                        submission={submission}
                        duelId={duelId}
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
