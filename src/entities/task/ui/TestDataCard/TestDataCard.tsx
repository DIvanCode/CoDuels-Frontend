import { CopyButton } from "shared/ui";
import styles from "./TestDataCard.module.scss";

interface Props {
    title: string;
    testData: string;
}

export const TestDataCard = ({ title, testData }: Props) => {
    return (
        <div className={styles.testDataCard}>
            <header>
                <strong>{title}</strong>
                <CopyButton textToCopy={testData} />
            </header>

            <pre>{testData}</pre>
        </div>
    );
};
