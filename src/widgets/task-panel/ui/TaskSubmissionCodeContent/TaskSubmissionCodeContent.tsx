import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader, MonacoEditor, ResultTitle, DropdownMenu, Button, CopyButton } from "shared/ui";
import { useGetSubmissionDetailQuery } from "features/submit-code";
import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import KeyboardArrowDownIcon from "shared/assets/icons/keyboard-arrow-down.svg?react";
import {
    formatDate,
    getDisplayText,
    getVerdictVariant,
    mapLanguageToLanguageValue,
} from "widgets/task-panel/lib/submissionUtils";

import { baseEditorConfig, fromApiLanguage, LANGUAGE_LABELS } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { selectThemeMode } from "features/theme";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";
import { setCode, setLanguage } from "widgets/code-panel/model/codeEditorSlice";
import styles from "./TaskSubmissionCodeContent.module.scss";

export const TaskSubmissionCodeContent = () => {
    const { duelId, submissionId } = useParams<{ duelId: string; submissionId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();

    const {
        data: submissionDetail,
        isLoading,
        isError,
    } = useGetSubmissionDetailQuery(
        { duelId: duelId ?? "", submissionId: submissionId ?? "" },
        {
            skip: !duelId || !submissionId,
        },
    );
    const { data: duel } = useGetDuelQuery(Number(duelId), { skip: !duelId });
    const { selectedTaskId } = useDuelTaskSelection(duel);
    const theme = useAppSelector(selectThemeMode);

    const handleBackClick = () => {
        const taskKey = searchParams.get("task");
        const taskParam = taskKey ? `?task=${encodeURIComponent(taskKey)}` : "";
        navigate(`/duel/${duelId}/submissions${taskParam}`);
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
    const verdictValue = verdict ?? undefined;
    const messageValue = message ?? undefined;
    const displayText = getDisplayText(status, verdictValue, messageValue);
    const variant = getVerdictVariant(verdictValue, status, messageValue);

    const { language, created_at, solution } = submissionDetail;
    const solutionText = solution ?? "";
    const languageValue = mapLanguageToLanguageValue(submissionDetail.language);
    const editorTaskKey =
        duelId && selectedTaskId ? buildDuelTaskKey(Number(duelId), selectedTaskId) : null;

    const handleApplyCodeToEditor = () => {
        if (!editorTaskKey) return;

        dispatch(setCode({ taskKey: editorTaskKey, code: solutionText }));
        dispatch(setLanguage({ taskKey: editorTaskKey, language: languageValue }));
    };
    const languageLabel = language ? LANGUAGE_LABELS[fromApiLanguage(language)] : "—";

    return (
        <div className={styles.container}>
            <div className={styles.navigationBar}>
                <Button
                    variant="outlined"
                    onClick={handleBackClick}
                    className={styles.backButton}
                    leadingIcon={<KeyboardArrowDownIcon className={styles.backButtonIcon} />}
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
                        <div className={styles.language}>{languageLabel}</div>
                        <div className={styles.date}>{formatDate(created_at)}</div>
                    </div>
                </div>
            </div>
            <div className={styles.editorContainer}>
                <div className={styles.editorWrapper}>
                    <CopyButton
                        textToCopy={solutionText}
                        onCopy={handleApplyCodeToEditor}
                        className={styles.copyCodeButton}
                        size="medium"
                    />

                    <MonacoEditor
                        height="100%"
                        value={solutionText}
                        theme={theme}
                        onValueChange={() => {}}
                        language={languageValue}
                        options={{ ...baseEditorConfig, readOnly: true }}
                    />
                </div>
            </div>
        </div>
    );
};
