import Split from "react-split";
import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    return (
        <div className={styles.duelPage}>
            <Split direction="horizontal" sizes={[50, 50]} minSize={300} className={styles.split}>
                <CodePanel />
                <TaskPanel />
            </Split>
        </div>
    );
};

export default DuelPage;
