import { Task, TestCase } from "entities/task/model/types";

import { MarkdownSection, Section } from "shared/ui";
import { TestCaseSection } from "../TestCaseSection/TestCaseSection";
import styles from "./TaskDescription.module.scss";

interface Props {
    task: Task;
    taskDescription: string;
    testCases: TestCase[];
}

export const TaskDescription = ({ task, taskDescription, testCases }: Props) => {
    return (
        <div className={styles.taskDescription}>
            <MarkdownSection content={`# ${task.name}\n\n${taskDescription}`} />

            <Section title="Ограничения">
                <dl className={styles.runtimeLimits}>
                    <dt>Лимит по времени</dt>
                    <dd>{task.tl / 1000} с</dd>
                    <dt>Лимит по памяти</dt>
                    <dd>{task.ml} МБ</dd>
                </dl>
            </Section>

            <Section className={styles.testCases} title="Примеры">
                {testCases?.map((testCase) => (
                    <TestCaseSection key={testCase.order} testCase={testCase} />
                )) ?? "No test cases"}
            </Section>
        </div>
    );
};
