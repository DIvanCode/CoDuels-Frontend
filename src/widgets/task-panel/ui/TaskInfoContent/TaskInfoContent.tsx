import { TaskDescription } from "entities/task";
import { useParams } from "react-router-dom";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { LANGUAGES } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader } from "shared/ui";
import { useTaskInfo } from "widgets/task-panel/lib/useTaskInfo";
import { selectDuelCode, selectDuelLanguage } from "widgets/code-panel/model/selector";
import styles from "./TaskInfoContent.module.scss";

export const TaskInfoContent = () => {
    const { duelId } = useParams();
    const duelIdNumber = Number(duelId);
    const isValidDuelId = Number.isFinite(duelIdNumber);
    const user = useAppSelector(selectCurrentUser);
    const { data: duel } = useGetDuelQuery(duelIdNumber, { skip: !isValidDuelId });
    const { selectedTaskId, selectedTaskKey } = useDuelTaskSelection(duel);
    const isParticipant = (duel?.participants ?? []).some(
        (participant) => participant.id === user?.id,
    );
    const code = useAppSelector((state) =>
        isValidDuelId ? selectDuelCode(state, duelIdNumber, selectedTaskId) : "",
    );
    const language = useAppSelector((state) =>
        isValidDuelId ? selectDuelLanguage(state, duelIdNumber, selectedTaskId) : LANGUAGES.CPP,
    );

    const { data, isLoading, isError, error, isLocked } = useTaskInfo(duelIdNumber);
    const { task, statement, testCases } = data;

    if (isLoading) {
        return <Loader className={styles.loader} />;
    }

    if (isError) {
        return <p>Something went wrong: {JSON.stringify(error)}</p>;
    }

    if (isLocked) {
        return <div className={styles.lockedState}>Эта задача пока что закрыта</div>;
    }

    if (!task?.task || !statement || !testCases) {
        return <p>Data incomplete</p>;
    }

    return (
        <TaskDescription
            task={task.task}
            testCases={testCases}
            taskDescription={statement}
            code={code}
            language={language}
            duelId={isValidDuelId ? duelIdNumber : undefined}
            taskKey={selectedTaskKey}
            userId={user?.id}
            canRunCode={isParticipant}
        />
    );
};
