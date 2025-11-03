import { skipToken } from "@reduxjs/toolkit/query";
import { useGetDuelQuery } from "entities/duel";
import { useGetTaskFileQuery, useGetTaskQuery, useGetTaskTestsQuery } from "entities/task";

export function useTaskInfo(duelId?: number) {
    const duelQuery = useGetDuelQuery(duelId ?? skipToken);
    const taskQuery = useGetTaskQuery(duelQuery.data?.task_id ?? skipToken);
    const statementQuery = useGetTaskFileQuery(
        taskQuery?.data?.task
            ? { taskId: taskQuery.data.task.id, filename: taskQuery.data.task.statement }
            : skipToken,
    );
    const testsQuery = useGetTaskTestsQuery(taskQuery?.data?.task ?? skipToken);

    const isLoading =
        duelQuery.isLoading ||
        taskQuery.isLoading ||
        statementQuery.isLoading ||
        testsQuery.isLoading;

    const error = duelQuery.error || taskQuery.error || statementQuery.error || testsQuery.error;

    return {
        data: {
            task: taskQuery.data,
            statement: statementQuery.data,
            testCases: testsQuery.data,
        },
        isLoading,
        isError: Boolean(error),
        error,
    };
}
