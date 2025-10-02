import languageSelectorReducer from "./model/language-selector/languagesSelectorSlice";
import codeEditorReducer from "./model/code-editor/codeEditorSlice";

export { languageSelectorReducer };

export { CodeEditor } from "./ui/CodeEditor/CodeEditor";
export {
    setCode,
    setTheme,
    setFontSize,
    toggleWordWrap,
    toggleMinimap,
    resetEditor,
} from "./model/code-editor/codeEditorSlice";
export { codeEditorReducer };

export {
    selectCode,
    selectTheme,
    selectFontSize,
    selectWordWrap,
    selectMinimap,
} from "./model/code-editor/selectors";

export { FileLoader } from "./ui/FileLoader/FileLoader";
