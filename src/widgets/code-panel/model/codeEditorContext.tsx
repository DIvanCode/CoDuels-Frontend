import { createContext, useContext, ReactNode } from "react";
import type { LanguageValue } from "shared/config";

interface CodeEditorContextType {
    code: string;
    language: LanguageValue;
    setCode: (code: string) => void;
    setLanguage: (language: LanguageValue) => void;
}

const CodeEditorContext = createContext<CodeEditorContextType | null>(null);

export const useCodeEditor = () => {
    return useContext(CodeEditorContext);
};

interface CodeEditorProviderProps {
    children: ReactNode;
    code: string;
    language: LanguageValue;
    setCode: (code: string) => void;
    setLanguage: (language: LanguageValue) => void;
}

export const CodeEditorProvider = ({
    children,
    code,
    language,
    setCode,
    setLanguage,
}: CodeEditorProviderProps) => {
    return (
        <CodeEditorContext.Provider value={{ code, language, setCode, setLanguage }}>
            {children}
        </CodeEditorContext.Provider>
    );
};
