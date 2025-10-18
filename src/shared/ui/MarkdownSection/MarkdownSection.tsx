import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

import styles from "./MarkdownSection.module.scss";

interface Props {
    content: string;
}

export const MarkdownSection = ({ content }: Props) => {
    return (
        <section className={styles.markdownContainer}>
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
                {content}
            </Markdown>
        </section>
    );
};
