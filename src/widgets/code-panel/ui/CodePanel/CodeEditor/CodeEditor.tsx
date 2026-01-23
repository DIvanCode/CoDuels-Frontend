import { useCallback, useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { editor as MonacoEditorType } from "monaco-editor";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { selectThemeMode } from "features/theme";
import { baseEditorConfig, LANGUAGES } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { MonacoEditor } from "shared/ui";
import clsx from "clsx";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";
import { DEBOUNCE_DELAY } from "widgets/code-panel/lib/consts";
import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import {
    selectDuelCode,
    selectDuelLanguage,
    selectOpponentDuelCode,
    selectOpponentDuelLanguage,
} from "widgets/code-panel/model/selector";
import EditorHeader from "./EditorHeader/EditorHeader";
import styles from "./CodeEditor.module.scss";

type CodeEditorMode = "my" | "opponent";

interface CodeEditorProps {
    mode?: CodeEditorMode;
}

function CodeEditor({ mode = "my" }: CodeEditorProps) {
    const { duelId } = useParams();

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Only duel participants can write and submit code
    const currentUser = useAppSelector(selectCurrentUser);
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(Number(duelId));
    const canEdit =
        !isDuelLoading && (duel?.participants ?? []).some((p) => p.id === currentUser?.id);
    const { selectedTaskId, selectedTaskKey } = useDuelTaskSelection(duel);

    const initialCode = useAppSelector((state) => {
        if (!duelId) return "";
        return mode === "opponent"
            ? selectOpponentDuelCode(state, Number(duelId), selectedTaskId)
            : selectDuelCode(state, Number(duelId), selectedTaskId);
    });

    const initialLanguage = useAppSelector((state) => {
        if (!duelId) return LANGUAGES.CPP;
        return mode === "opponent"
            ? selectOpponentDuelLanguage(state, Number(duelId), selectedTaskId)
            : selectDuelLanguage(state, Number(duelId), selectedTaskId);
    });
    const theme = useAppSelector(selectThemeMode);

    const [localCode, setLocalCode] = useState<string>(initialCode);
    const [localLanguage, setLocalLanguage] = useState<LANGUAGES>(initialLanguage);
    const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
    const editorCleanupRef = useRef<(() => void) | null>(null);

    const taskKey =
        duelId && selectedTaskId ? buildDuelTaskKey(Number(duelId), selectedTaskId) : null;

    const debouncedCodeCb = useDebouncedCallback(
        (code: string, key: string) => dispatch(setCode({ taskKey: key, code })),
        DEBOUNCE_DELAY,
    );

    const debouncedLanguageCb = useDebouncedCallback(
        (language: LANGUAGES, key: string) => dispatch(setLanguage({ taskKey: key, language })),
        DEBOUNCE_DELAY,
    );

    const onCodeChange = (code: string) => {
        if (mode === "opponent") return;
        setLocalCode(code);
        if (taskKey) {
            debouncedCodeCb(code, taskKey);
        }
    };

    const onLanguageChange = (language: LANGUAGES) => {
        if (mode === "opponent") return;
        setLocalLanguage(language);
        if (taskKey) {
            debouncedLanguageCb(language, taskKey);
        }
    };

    const handleEditorMount = useCallback<OnMount>((editor) => {
        editorRef.current = editor;
    }, []);

    useEffect(() => {
        editorCleanupRef.current?.();
        editorCleanupRef.current = null;

        if (mode !== "opponent") return;

        const editor = editorRef.current;
        const domNode = editor?.getDomNode();

        if (!editor || !domNode) return;

        const preventDefault = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        const preventIfFromEditor = (event: Event) => {
            if (event.target instanceof Node && domNode.contains(event.target)) {
                preventDefault(event);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const isCopyShortcut =
                (event.ctrlKey || event.metaKey) &&
                (event.key === "c" ||
                    event.key === "C" ||
                    event.key === "x" ||
                    event.key === "X" ||
                    event.key === "a" ||
                    event.key === "A");

            if (isCopyShortcut) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        const keydownDisposable = editor.onKeyDown((event) => {
            const isCopyShortcut =
                (event.ctrlKey || event.metaKey) &&
                (event.keyCode === monaco.KeyCode.KeyC ||
                    event.keyCode === monaco.KeyCode.KeyX ||
                    event.keyCode === monaco.KeyCode.KeyA);

            if (isCopyShortcut) {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        domNode.addEventListener("copy", preventDefault);
        domNode.addEventListener("cut", preventDefault);
        domNode.addEventListener("contextmenu", preventDefault);
        domNode.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("copy", preventIfFromEditor, true);
        document.addEventListener("cut", preventIfFromEditor, true);

        editorCleanupRef.current = () => {
            domNode.removeEventListener("copy", preventDefault);
            domNode.removeEventListener("cut", preventDefault);
            domNode.removeEventListener("contextmenu", preventDefault);
            domNode.removeEventListener("keydown", handleKeyDown, true);
            document.removeEventListener("copy", preventIfFromEditor, true);
            document.removeEventListener("cut", preventIfFromEditor, true);
            keydownDisposable.dispose();
        };

        return () => {
            editorCleanupRef.current?.();
            editorCleanupRef.current = null;
        };
    }, [mode]);
    const onSubmissionStart = () => {
        if (!duelId) return;
        const nextParams = new URLSearchParams(location.search);
        if (selectedTaskKey) {
            nextParams.set("task", selectedTaskKey);
        }
        const search = nextParams.toString();
        navigate({
            pathname: `/duel/${duelId}/submissions`,
            search: search ? `?${search}` : "",
        });
    };

    useEffect(() => {
        setLocalCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        setLocalLanguage(initialLanguage);
    }, [initialLanguage]);

    if (!duelId) return null;

    return (
        <div className={clsx(styles.codeEditor, mode === "opponent" && styles.noSelect)}>
            <EditorHeader
                code={localCode}
                language={localLanguage}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onSubmissionStart={onSubmissionStart}
                duelId={duelId}
                taskKey={selectedTaskKey}
                readOnly={mode === "opponent"}
            />

            <MonacoEditor
                height="100%"
                value={localCode}
                onValueChange={onCodeChange}
                language={localLanguage}
                theme={theme}
                options={{
                    ...baseEditorConfig,
                    readOnly: mode === "opponent" || !canEdit,
                    domReadOnly: mode === "opponent",
                    contextmenu: mode !== "opponent",
                    selectionClipboard: mode !== "opponent",
                }}
                className={styles.editor}
                onEditorMount={handleEditorMount}
            />
        </div>
    );
}

export default CodeEditor;
