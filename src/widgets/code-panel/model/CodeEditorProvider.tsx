import type { ReactNode } from "react";
import type { CodeEditorContextValue } from "./codeEditorContext";
import { CodeEditorContext } from "./codeEditorContext";

interface CodeEditorProviderProps extends CodeEditorContextValue {
    children: ReactNode;
}

export const CodeEditorProvider = ({
    children,
    code,
    language,
    setCode,
    setLanguage,
}: CodeEditorProviderProps) => {
    return (
        <CodeEditorContext value={{ code, language, setCode, setLanguage }}>
            {children}
        </CodeEditorContext>
    );
};
