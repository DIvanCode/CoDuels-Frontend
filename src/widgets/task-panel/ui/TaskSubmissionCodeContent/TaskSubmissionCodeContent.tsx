import { useParams, useNavigate } from "react-router-dom";
import { Loader, MonacoEditor, ResultTitle, DropdownMenu, Button, CopyButton } from "shared/ui";
import { useGetSubmissionDetailQuery, POOLING_INTERVAL } from "features/submit-code";
import KeyboardArrowDownIcon from "shared/assets/icons/keyboard-arrow-down.svg?react";
import { useState, useEffect } from "react";
import {
    formatDate,
    getDisplayText,
    getVerdictVariant,
    mapLanguageToLanguageValue,
} from "widgets/task-panel/lib/submissionUtils";

import { baseEditorConfig } from "shared/config";
import styles from "./TaskSubmissionCodeContent.module.scss";

export const TaskSubmissionCodeContent = () => {
    const { duelId, submissionId } = useParams<{ duelId: string; submissionId: string }>();
    const navigate = useNavigate();
    const [shouldPoll, setShouldPoll] = useState(true);

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

    const { status, verdict, message } = submissionDetail;
    const displayText = getDisplayText(status, verdict, message);
    const variant = getVerdictVariant(verdict, status, message);

    const { language, created_at, solution } = submissionDetail;
    const languageValue = mapLanguageToLanguageValue(submissionDetail.language);

    return (
        <div className={styles.container}>
            <div className={styles.navigationBar}>
                <Button
                    variant="outlined"
                    onClick={handleBackClick}
                    className={styles.backButton}
                    leadingIcon={<KeyboardArrowDownIcon style={{ transform: "rotate(90deg)" }} />}
                >
                    Все решения
                </Button>
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
                                            <CopyButton textToCopy={message ?? ""} />
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
                        <div className={styles.date}>{formatDate(created_at)}</div>
                    </div>
                </div>
            </div>
            <div className={styles.editorContainer}>
                <MonacoEditor
                    height="100%"
                    value={solution}
                    theme="dark"
                    onValueChange={() => {}}
                    language={languageValue}
                    options={{ ...baseEditorConfig, readOnly: true }}
                />
            </div>
        </div>
    );
};
