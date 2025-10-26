import { useState } from "react";
import { useParams } from "react-router-dom";
import { LANGUAGES, LanguageValue } from "features/duel-code-editor";
import styles from "./CodeEditor.module.scss";
import EditorHeader from "./EditorHeader/EditorHeader";
import { Editor } from "./Editor/Editor";

function CodeEditor() {
    const { duelId } = useParams();
    const [code, setCode] = useState<string>("");
    const [language, setLanguage] = useState<LanguageValue>(LANGUAGES.CPP);

    // Validate duelId
    if (!duelId) {
        return null;
    }

    const onSubmissionStart = () => {
        alert("code submitted");
    };

    const onSubmissionComplete = (result?: { verdict: string; message?: string }) => {
        alert("code result: " + result?.verdict);
    };

    const onCodeChange = (newCode: string) => {
        setCode(newCode);
    };

    const onLanguageChange = (newLanguage: LanguageValue) => {
        setLanguage(newLanguage);
    };

    return (
        <div className={styles.codeEditor}>
            <EditorHeader
                code={code}
                language={language}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onSubmissionComplete={onSubmissionComplete}
                onSubmissionStart={onSubmissionStart}
                duelId={duelId}
            />
            <Editor code={code} language={language} onCodeChange={onCodeChange} height="100%" />
        </div>
    );
}

export default CodeEditor;
