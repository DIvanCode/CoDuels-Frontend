import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    return (
        <div className={styles.duelPage}>
            <CodePanel />
            <TaskPanel />
        </div>
    );
};

export default DuelPage;
