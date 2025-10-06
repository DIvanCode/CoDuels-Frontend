import { CodeEditor } from "features/duel-code-editor";
import EditorHeader from "./Header";
import Codeicon from "shared/assets/icons/code.svg?react";

import styles from "./CodeEditor.module.scss";

function Editor() {
    return (
        <div className={styles.codeEditor}>
            <div className={styles.title}>
                <Codeicon /> Код
            </div>
            <EditorHeader />
            <CodeEditor />
        </div>
    );
}

export default Editor;
