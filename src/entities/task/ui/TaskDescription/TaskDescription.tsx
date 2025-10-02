import { Task } from "entities/task/model/types";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

import styles from "./TaskDescription.module.scss";

interface Props {
    task: Task;
    taskDescription: string;
}

export const TaskDescription = ({ task, taskDescription }: Props) => {
    const description = `# ${task.name}\n\n${taskDescription}\n\n`;
    return (
        <div className={styles.markdownContainer}>
            <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    a: ({ node, ...props }) => (
                        <a target="_blank" rel="noopener noreferrer" {...props}>
                            {props.children}
                        </a>
                    ),
                }}
            >
                {description}
            </Markdown>
        </div>
    );
};
