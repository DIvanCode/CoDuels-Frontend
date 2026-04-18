import { TestCase } from "entities/task/model/types";

import { Section } from "shared/ui";
import { TestDataCard } from "../TestDataCard/TestDataCard";
import styles from "./TestCaseSection.module.scss";

interface Props {
    testCase: TestCase;
    onRun: (input: string) => void;
    isRunDisabled?: boolean;
}

export const TestCaseSection = ({ testCase, onRun, isRunDisabled = false }: Props) => {
    return (
        <Section
            variant="secondary"
            title={`Пример ${testCase.order}`}
            titleActionPosition="inline"
            titleAction={
                <button
                    type="button"
                    className={styles.runButton}
                    aria-label={`Запустить пример ${testCase.order}`}
                    disabled={isRunDisabled}
                    onClick={() => onRun(testCase.input)}
                >
                    <span className={styles.runTriangle} />
                </button>
            }
        >
            <div className={styles.testData}>
                <TestDataCard title="Ввод" testData={testCase.input} showCopy={false} />
                <TestDataCard title="Вывод" testData={testCase.output} showCopy={false} />
            </div>
        </Section>
    );
};
