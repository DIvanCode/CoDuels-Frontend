import { CopyButton } from "shared/ui";
import styles from "./TestDataCard.module.scss";

interface Props {
    title: string;
    testData: string;
    showCopy?: boolean;
}

export const TestDataCard = ({ title, testData, showCopy = true }: Props) => {
    return (
        <div className={styles.testDataCard}>
            <header>
                <strong>{title}</strong>
                {showCopy ? <CopyButton textToCopy={testData} /> : null}
            </header>

            <pre>{testData}</pre>
        </div>
    );
};
