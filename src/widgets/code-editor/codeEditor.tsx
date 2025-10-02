import { CodeEditor, FileLoader, SubmitCodeButton } from "features/duel-code-editor";
import { LanguageSelector } from "features/duel-code-editor/ui/LanguageSelector/LanguageSelector";

function Editor() {
    return (
        <div>
            <LanguageSelector />
            <FileLoader />
            <SubmitCodeButton />
            <CodeEditor />
        </div>
    );
}

export default Editor;
