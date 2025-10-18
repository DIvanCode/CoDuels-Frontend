import { TestCase } from "entities/task/model/types";

import { Section } from "shared/ui";
import { TestDataCard } from "../TestDataCard/TestDataCard";
import styles from "./TestCaseSection.module.scss";

interface Props {
    testCase: TestCase;
}

export const TestCaseSection = ({ testCase }: Props) => {
    return (
        <Section variant="secondary" title={`Пример ${testCase.order}`}>
            <div className={styles.testData}>
                <TestDataCard title="Ввод" testData={testCase.input} />
                <TestDataCard title="Вывод" testData={testCase.output} />
            </div>
        </Section>
    );
};
