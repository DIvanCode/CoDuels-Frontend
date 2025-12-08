import Split from "react-split";
import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    return (
        <Split direction="horizontal" sizes={[50, 50]} minSize={300} className={styles.duelPage}>
            <CodePanel />
            <TaskPanel />
        </Split>
    );
};

export default DuelPage;
