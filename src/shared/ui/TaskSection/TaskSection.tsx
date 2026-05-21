import { HtmlSection } from "../HtmlSection/HtmlSection";
import { MarkdownSection } from "../MarkdownSection/MarkdownSection";

interface Props {
    content: string;
}

const HTML_TAG_RE =
    /<\/?(?:a|article|b|blockquote|body|br|code|dd|div|dl|dt|em|head|h[1-6]|html|i|img|li|main|ol|p|pre|section|span|strong|table|tbody|td|th|thead|tr|ul)\b/i;

const isHTMLStatement = (content: string) => HTML_TAG_RE.test(content);

export const TaskSection = ({ content }: Props) => {
    if (isHTMLStatement(content)) {
        return <HtmlSection content={content} />;
    }

    return <MarkdownSection content={content} />;
};
