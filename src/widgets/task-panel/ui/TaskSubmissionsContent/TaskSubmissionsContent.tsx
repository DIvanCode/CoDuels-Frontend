import { useParams } from "react-router-dom";
import { Loader, Table } from "shared/ui";
import { useGetSubmissionsQuery, POOLING_INTERVAL } from "features/submit-code";

import { useEffect, useState } from "react";
import { TaskSubmissionRow } from "../TaskSubmissionRow/TaskSubmissionRow";
import styles from "./TaskSubmissionsContent.module.scss";

export const TaskSubmissionsContent = () => {
    const { duelId } = useParams();
    const [shouldPollSubmissions, setShouldPollSubmissions] = useState(true);

    const {
        data: submissions,
        isLoading,
        isError,
    } = useGetSubmissionsQuery(duelId ?? "", {
        skip: !duelId,
        pollingInterval: shouldPollSubmissions ? POOLING_INTERVAL : 0,
    });

    useEffect(() => {
        setShouldPollSubmissions(!submissions?.every((s) => s.status === "Done"));
    }, [submissions]);

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
                    <TaskSubmissionRow
                        key={submission.submission_id}
                        submission={submission}
                        duelId={duelId}
                    />
                ))}
            </tbody>
        </Table>
    );
};
