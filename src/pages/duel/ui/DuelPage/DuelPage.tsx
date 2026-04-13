import Split from "react-split";
import { useParams } from "react-router-dom";
import { selectCurrentUser } from "entities/user";
import { useActionsAutoFlush } from "features/anti-cheat";
import { selectAuthToken } from "features/auth";
import { useAppSelector } from "shared/lib/storeHooks";
import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    const { duelId } = useParams();
    const user = useAppSelector(selectCurrentUser);
    const token = useAppSelector(selectAuthToken);

    useActionsAutoFlush({
        enabled: Boolean(duelId && user?.id),
        token: token ?? null,
    });

    return (
        <Split direction="horizontal" sizes={[50, 50]} minSize={300} className={styles.duelPage}>
            <CodePanel />
            <TaskPanel />
        </Split>
    );
};

export default DuelPage;
