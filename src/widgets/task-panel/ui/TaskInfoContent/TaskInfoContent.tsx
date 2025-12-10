import { TaskDescription } from "entities/task";
import { useParams } from "react-router-dom";
import { Loader } from "shared/ui";
import { useTaskInfo } from "widgets/task-panel/lib/useTaskInfo";
import styles from "./TaskInfoContent.module.scss";

export const TaskInfoContent = () => {
    const { duelId } = useParams();

    const { data, isLoading, isError, error } = useTaskInfo(Number(duelId));
    const { task, statement, testCases } = data;

    if (isLoading) {
        return <Loader className={styles.loader} />;
    }

    if (isError) {
        return <p>Something went wrong: {JSON.stringify(error)}</p>;
    }

    if (!task?.task || !statement || !testCases) {
        return <p>Data incomplete</p>;
    }

    return <TaskDescription task={task.task} testCases={testCases} taskDescription={statement} />;
};
