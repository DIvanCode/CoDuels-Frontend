import katex from "katex";
import "katex/dist/katex.min.css";

import styles from "./HtmlSection.module.scss";

interface Props {
    content: string;
}

type MathDelimiter = {
    start: number;
    delimiter: string;
    displayMode: boolean;
};

const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const LEGACY_INLINE_MATH_DELIMITER = "$";
const INLINE_MATH_DELIMITER = "$$$";
const DISPLAY_MATH_DELIMITER = "$$$$$$";

const renderMath = (source: string, displayMode: boolean) => {
    return katex.renderToString(source, {
        displayMode,
        throwOnError: false,
        strict: false,
    });
};

const renderStatementHTML = (content: string) => {
    const source = content.replace(SCRIPT_TAG_RE, "");
    let result = "";
    let index = 0;

    while (index < source.length) {
        const displayStart = source.indexOf(DISPLAY_MATH_DELIMITER, index);
        const inlineStart = source.indexOf(INLINE_MATH_DELIMITER, index);
        const legacyInlineStart = source.indexOf(LEGACY_INLINE_MATH_DELIMITER, index);
        const hasDisplay = displayStart >= 0;
        const hasInline = inlineStart >= 0;
        const hasLegacyInline = legacyInlineStart >= 0;

        if (!hasDisplay && !hasInline && !hasLegacyInline) {
            result += source.slice(index);
            break;
        }

        const candidates: MathDelimiter[] = [];
        if (hasDisplay) {
            candidates.push({
                start: displayStart,
                delimiter: DISPLAY_MATH_DELIMITER,
                displayMode: true,
            });
        }
        if (hasInline) {
            candidates.push({
                start: inlineStart,
                delimiter: INLINE_MATH_DELIMITER,
                displayMode: false,
            });
        }
        if (hasLegacyInline) {
            candidates.push({
                start: legacyInlineStart,
                delimiter: LEGACY_INLINE_MATH_DELIMITER,
                displayMode: false,
            });
        }

        const next = candidates.reduce((min, candidate) =>
            candidate.start < min.start ? candidate : min,
        );
        const start = next.start;
        const delimiter = next.delimiter;
        const end = source.indexOf(delimiter, start + delimiter.length);

        if (end < 0) {
            result += source.slice(index);
            break;
        }

        result += source.slice(index, start);
        result += renderMath(source.slice(start + delimiter.length, end), next.displayMode);
        index = end + delimiter.length;
    }

    return result;
};

export const HtmlSection = ({ content }: Props) => {
    return (
        <section
            className={styles.htmlContainer}
            dangerouslySetInnerHTML={{ __html: renderStatementHTML(content) }}
        />
    );
};
