import { TaskDescription } from "entities/task";
import { useParams } from "react-router-dom";
import { useTaskInfo } from "widgets/task-panel/lib/useTaskInfo";

export const TaskInfoContent = () => {
    const { duelId } = useParams();

    const { data, isLoading, isError, error } = useTaskInfo(duelId);
    const { task, statement, testCases } = data;

    if (isLoading) return <p>Loading...</p>;

    if (isError) {
        return <p>Something went wrong: {JSON.stringify(error)}</p>;
    }

    if (!task || !statement || !testCases) {
        return <p>Data incomplete</p>;
    }

    return <TaskDescription task={task} testCases={testCases} taskDescription={statement} />;
};
