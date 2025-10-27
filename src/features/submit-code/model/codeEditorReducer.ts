import { LANGUAGES, LanguageValue } from "./languages";

interface CodeEditorState {
    code: string;
    language: LanguageValue;
    theme: "dark" | "light";
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
}

type Action =
    | { type: "SET_CODE"; payload: string }
    | { type: "SET_LANGUAGE"; payload: LanguageValue }
    | { type: "SET_THEME"; payload: "dark" | "light" }
    | { type: "SET_FONT_SIZE"; payload: number }
    | { type: "TOGGLE_WORD_WRAP" }
    | { type: "TOGGLE_MINIMAP" }
    | { type: "RESET" };

export const codeEditorInitialState: CodeEditorState = {
    code: "",
    language: LANGUAGES.CPP,
    theme: "dark",
    fontSize: 16,
    wordWrap: true,
    minimap: true,
};

export const codeEditorReducer = (state: CodeEditorState, action: Action) => {
    switch (action.type) {
        case "SET_CODE":
            return { ...state, code: action.payload };
        case "SET_LANGUAGE":
            return { ...state, language: action.payload };
        case "SET_THEME":
            return { ...state, theme: action.payload };
        case "SET_FONT_SIZE":
            return { ...state, fontSize: action.payload };
        case "TOGGLE_WORD_WRAP":
            return { ...state, wordWrap: !state.wordWrap };
        case "TOGGLE_MINIMAP":
            return { ...state, minimap: !state.minimap };
        case "RESET":
            return codeEditorInitialState;
        default:
            return state;
    }
};
