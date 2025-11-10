import { createContext, use } from "react";
import type { LanguageValue } from "shared/config";

export interface CodeEditorContextValue {
    code: string;
    language: LanguageValue;
    setCode: (code: string) => void;
    setLanguage: (language: LanguageValue) => void;
}

export const CodeEditorContext = createContext<CodeEditorContextValue | null>(null);

export const useCodeEditor = () => use(CodeEditorContext);
