import { TaskDescription, useGetTaskFileQuery, useGetTaskQuery } from "entities/task";

const DuelPage = () => {
    const { data: taskData, isLoading: isTaskLoading } = useGetTaskQuery("124");

    const {
        data: content,
        isLoading,
        error,
    } = useGetTaskFileQuery({ taskId: "1", filename: "statement.md" });

    if (isLoading || isTaskLoading) return <p>Loading content...</p>;

    if (error || !taskData) {
        return <div>error</div>;
    }

    return (
        <div>
            <TaskDescription task={taskData} taskDescription={content || ""} />
        </div>
    );
};

export default DuelPage;
