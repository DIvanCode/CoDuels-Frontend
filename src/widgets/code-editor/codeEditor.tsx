import { CodeEditor } from "features/duel-code-editor";
import { LanguageSelector } from "features/duel-code-editor/ui/LanguageSelector/LanguageSelector";

function Editor() {
    return (
        <div>
            <LanguageSelector />
            <CodeEditor />
        </div>
    );
}

export default Editor;
