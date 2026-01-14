import { LanguageValue } from "shared/config";

export interface CodeEditorState {
    codeByTaskKey: Record<string, string>;
    languageByTaskKey: Record<string, LanguageValue>;
}
