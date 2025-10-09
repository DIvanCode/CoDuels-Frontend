import {
    TaskDescription,
    useGetTaskFileQuery,
    useGetTaskQuery,
    useGetTaskTestsQuery,
} from "entities/task";

// TODO: надо посидеть поразбираться с запросами
export const TaskInfoContent = () => {
    // const duelSession = useAppSelector(selectDuelSession);

    // const { data: duel, isLoading: isDuelIdLoading } = useGetDuelQuery(duelSession.activeDuelId!, {
    //     skip: !duelSession,
    // });

    // const { data: duel, isLoading: isDuelIdLoading } = useGetDuelQuery(duelSession.activeDuelId!, {
    //     skip: !duelSession,
    // });

    // const { data: task, isLoading: isTaskLoading } = useGetTaskQuery(duel!.task_id, {
    //     skip: !duel || isDuelIdLoading,
    // });

    const taskId = "1";
    const { data: task, isLoading: isTaskLoading } = useGetTaskQuery(taskId);
    const { data: statement, isLoading: isStatementLoading } = useGetTaskFileQuery(
        {
            taskId: taskId,
            filename: "statement.md", // TODO: заглушка
        },
        { skip: !task || isTaskLoading },
    );

    const { data: testCases, isLoading: isTestCasesLoading } = useGetTaskTestsQuery(task!, {
        skip: !task || isTaskLoading,
    });

    if (isStatementLoading || isTaskLoading || isTestCasesLoading) return <p>Loading content...</p>;

    return <TaskDescription task={task!} testCases={testCases!} taskDescription={statement!} />;
};
