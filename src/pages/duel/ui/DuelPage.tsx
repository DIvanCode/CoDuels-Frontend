import {
    TaskDescription,
    useGetTaskFileQuery,
    useGetTaskQuery,
    useGetTaskTestsQuery,
} from "entities/task";

const TaskSubmissions = () => {
    return <p>Submissions</p>;
};

const DuelPage = () => {
    const taskId = "1";

    const { data: task, isLoading: isTaskLoading } = useGetTaskQuery(taskId);
    const { data: statement, isLoading } = useGetTaskFileQuery({
        taskId: taskId,
        filename: "statement.md",
    });
    const { data: testCases, isLoading: isTestCasesLoading } = useGetTaskTestsQuery(task!, {
        skip: !task,
    });

    if (isLoading || isTaskLoading || isTestCasesLoading) return <p>Loading content...</p>;
    return <TaskDescription task={task!} testCases={testCases!} taskDescription={statement!} />;
};

export default DuelPage;
