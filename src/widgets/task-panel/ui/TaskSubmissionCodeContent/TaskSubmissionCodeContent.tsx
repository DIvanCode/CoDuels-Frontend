import { useParams, useNavigate } from "react-router-dom";
import { Loader, MonacoEditor, ResultTitle, DropdownMenu } from "shared/ui";
import { useGetSubmissionDetailQuery, POOLING_INTERVAL } from "features/submit-code";
import { LANGUAGES, type LanguageValue } from "shared/config";
import KeyboardArrowDownIcon from "shared/assets/icons/keyboard-arrow-down.svg?react";
import { useMemo, useState, useEffect, useRef } from "react";
import { editor } from "monaco-editor";
import CopyIcon from "shared/assets/icons/copy.svg?react";
import CopySuccessIcon from "shared/assets/icons/copy-success.svg?react";
import {
    formatDate,
    getDisplayText,
    getVerdictVariant,
} from "widgets/task-panel/lib/submissionUtils";

import styles from "./TaskSubmissionCodeContent.module.scss";

const mapLanguageToLanguageValue = (language: string): LanguageValue => {
    const normalized = language.toLowerCase().trim();
    if (normalized === "c++" || normalized === "cpp") {
        return LANGUAGES.CPP;
    }
    if (normalized === "c#" || normalized === "csharp") {
        return LANGUAGES.CSHARP;
    }
    if (normalized === "python") {
        return LANGUAGES.PYTHON;
    }
    return LANGUAGES.CPP;
};

export const TaskSubmissionCodeContent = () => {
    const { duelId, submissionId } = useParams<{ duelId: string; submissionId: string }>();
    const navigate = useNavigate();
    const [shouldPoll, setShouldPoll] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        data: submissionDetail,
        isLoading,
        isError,
    } = useGetSubmissionDetailQuery(
        { duelId: duelId ?? "", submissionId: submissionId ?? "" },
        {
            skip: !duelId || !submissionId,
            pollingInterval: shouldPoll ? POOLING_INTERVAL : 0,
        },
    );

    useEffect(() => {
        if (submissionDetail?.status?.toLowerCase() === "done") {
            setShouldPoll(false);
        }
    }, [submissionDetail?.status]);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const editorConfig = useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            readOnly: true,
            theme: "dark",
            fontSize: 14,
            wordWrap: "on",
            minimap: { enabled: true },
        }),
        [],
    );

    const handleCopyMessage = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!message) return;

        try {
            await navigator.clipboard.writeText(message);
            setIsCopied(true);
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 1500);
        } catch (error) {
            console.error("Failed to copy submission message", error);
        }
    };

    const handleBackClick = () => {
        navigate(`/duel/${duelId}/submissions`);
    };

    if (isLoading) {
        return <Loader />;
    }

    if (isError || !submissionDetail) {
        return <div>Ошибка при загрузке посылки</div>;
    }

    if (!duelId || !submissionId) {
        return <div>Ошибка: не указан ID дуэли или посылки</div>;
    }

    const status = submissionDetail.status;
    const verdict = submissionDetail.verdict;
    const message = submissionDetail.message;
    const displayText = getDisplayText(status, verdict, message);
    const variant = getVerdictVariant(verdict, status, message);
    const language = submissionDetail.language || "—";
    const displayDate = submissionDetail.submit_time;
    const solution = submissionDetail.solution || "";
    const languageValue = submissionDetail.language
        ? mapLanguageToLanguageValue(submissionDetail.language)
        : LANGUAGES.CPP;

    return (
        <div className={styles.container}>
            <div className={styles.navigationBar}>
                <button className={styles.backButton} onClick={handleBackClick}>
                    <KeyboardArrowDownIcon className={styles.backIcon} />
                    <span>Все решения</span>
                </button>
                <div className={styles.submissionInfo}>
                    {message ? (
                        <DropdownMenu
                            trigger={<ResultTitle variant={variant}>{displayText}</ResultTitle>}
                            items={[
                                {
                                    id: "message-header",
                                    label: (
                                        <div className={styles.messageDropdownHeader}>
                                            Сообщение
                                        </div>
                                    ),
                                    closeOnClick: false,
                                },
                                {
                                    id: "message-content",
                                    label: (
                                        <div className={styles.messageDropdownContent}>
                                            <span className={styles.messageDropdownText}>
                                                {message}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.messageCopyButton}
                                                onClick={handleCopyMessage}
                                            >
                                                {isCopied ? <CopySuccessIcon /> : <CopyIcon />}
                                            </button>
                                        </div>
                                    ),
                                    closeOnClick: false,
                                },
                            ]}
                            dropdownClassName={styles.messageDropdown}
                            triggerClassName={styles.messageDropdownTrigger}
                            menuClassName={styles.messageDropdownMenu}
                            itemClassName={styles.messageDropdownItem}
                        />
                    ) : (
                        <ResultTitle variant={variant}>{displayText}</ResultTitle>
                    )}
                    <div className={styles.divider} />
                    <div className={styles.metaInfo}>
                        <div className={styles.language}>{language}</div>
                        <div className={styles.date}>{formatDate(displayDate)}</div>
                    </div>
                </div>
            </div>
            <div className={styles.editorContainer}>
                <MonacoEditor
                    height="100%"
                    value={solution}
                    onValueChange={() => {}}
                    language={languageValue}
                    theme="dark"
                    options={editorConfig}
                />
            </div>
        </div>
    );
};
