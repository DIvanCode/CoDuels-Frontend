import { HtmlSection } from "../HtmlSection/HtmlSection";
import { MarkdownSection } from "../MarkdownSection/MarkdownSection";

interface Props {
    content: string;
    filename: string;
}

const isHTMLStatement = (filename: string) => filename.toLowerCase().endsWith(".html");

export const TaskSection = ({ content, filename }: Props) => {
    if (isHTMLStatement(filename)) {
        return <HtmlSection content={content} />;
    }

    return <MarkdownSection content={content} />;
};
