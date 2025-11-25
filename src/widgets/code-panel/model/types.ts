import { LanguageValue } from "shared/config";

export interface CodeEditorState {
    codeByDuelId: Record<number, string>;
    languageByDuelId: Record<number, LanguageValue>;
}
