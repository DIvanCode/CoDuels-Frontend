import { skipToken } from "@reduxjs/toolkit/query";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { useGetTaskFileQuery, useGetTaskQuery, useGetTaskTestsQuery } from "entities/task";

export function useTaskInfo(duelId?: number) {
    const duelQuery = useGetDuelQuery(duelId ?? skipToken);
    const { selectedTaskId } = useDuelTaskSelection(duelQuery.data);
    const isLocked = selectedTaskId === null;
    const taskQuery = useGetTaskQuery(selectedTaskId ?? skipToken);
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
        isLocked,
        isLoading,
        isError: Boolean(error),
        error,
    };
}
