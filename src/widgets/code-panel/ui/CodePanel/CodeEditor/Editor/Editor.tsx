import { useState } from "react";
import { CodeEditor as SharedCodeEditor } from "shared/ui";
import { useCodeEditor, LANGUAGES } from "features/duel-code-editor";

interface EditorProps {
    height?: string;
    className?: string;
    code?: string;
    language?: string;
    onCodeChange?: (code: string) => void;
}

export const Editor = ({
    height = "100%",
    className = "",
    code,
    language = LANGUAGES.CPP,
    onCodeChange,
}: EditorProps) => {
    const [internalCode, setInternalCode] = useState(code || "");
    const currentCode = code !== undefined ? code : internalCode;

    const { theme, editorConfig } = useCodeEditor();

    const handleValueChange = (value: string) => {
        setInternalCode(value);
        onCodeChange?.(value);
    };

    return (
        <SharedCodeEditor
            height={height}
            className={className}
            value={currentCode}
            onValueChange={handleValueChange}
            language={language}
            theme={theme}
            options={editorConfig}
        />
    );
};
