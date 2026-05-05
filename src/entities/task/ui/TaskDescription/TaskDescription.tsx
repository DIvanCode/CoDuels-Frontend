import { useEffect, useMemo, useRef, useState } from "react";
import { trackRunCustomTestAction, trackRunSampleTestAction } from "features/anti-cheat";
import { useCreateCodeRunMutation, useLazyGetCodeRunQuery } from "entities/task";
import { LanguageValue, toApiLanguage } from "shared/config";
import { Task, TestCase } from "entities/task/model/types";
import EditIcon from "shared/assets/icons/edit.svg?react";

import { MarkdownSection, Section } from "shared/ui";
import { TestCaseSection } from "../TestCaseSection/TestCaseSection";
import styles from "./TaskDescription.module.scss";

interface Props {
    task: Task;
    taskDescription: string;
    testCases: TestCase[];
    code: string;
    language: LanguageValue;
    duelId?: number;
    taskKey?: string | null;
    userId?: number;
    canRunCode?: boolean;
}

type RunState = {
    type: "idle" | "running" | "done" | "error";
    text: string;
};

type PersistedRunPanelState = {
    runInput: string;
    runInputDraft: string;
    isRunInputEditing: boolean;
    runState: RunState;
};

type RunTriggerSource = "sample" | "custom";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 45000;
const REQUEST_TIMEOUT_MS = 8000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_RUN_STATE: RunState = { type: "idle", text: "" };

const buildRunPanelStorageKey = (
    duelId: number | undefined,
    taskKey: string | null | undefined,
    taskId: string,
) => `duel-run-panel:${duelId ?? "no-duel"}:${taskKey ?? taskId}`;

const getDefaultPersistedRunPanelState = (): PersistedRunPanelState => ({
    runInput: "",
    runInputDraft: "",
    isRunInputEditing: false,
    runState: DEFAULT_RUN_STATE,
});

const getScrollableAncestor = (element: HTMLElement | null): HTMLElement | null => {
    let current = element?.parentElement ?? null;

    while (current) {
        const style = window.getComputedStyle(current);
        const isScrollableBySize = current.scrollHeight > current.clientHeight + 1;
        const allowsScrollY = style.overflowY !== "visible" && style.overflowY !== "clip";
        const isScrollableY = isScrollableBySize && allowsScrollY;

        if (isScrollableY) {
            return current;
        }

        current = current.parentElement;
    }

    return null;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        });

        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    if (typeof error === "object" && error !== null && "data" in error) {
        const data = (error as { data?: unknown }).data;
        if (typeof data === "string" && data.trim()) {
            return data;
        }

        if (typeof data === "object" && data !== null) {
            const detail = (data as { detail?: unknown }).detail;
            const message = (data as { message?: unknown }).message;
            const title = (data as { title?: unknown }).title;
            const errors = (data as { errors?: unknown }).errors;

            if (typeof detail === "string" && detail.trim()) return detail;
            if (typeof message === "string" && message.trim()) return message;
            if (typeof title === "string" && title.trim()) return title;

            if (typeof errors === "object" && errors !== null) {
                const firstErrorList = Object.values(errors)[0];
                if (Array.isArray(firstErrorList)) {
                    const firstError = firstErrorList.find(
                        (value) => typeof value === "string" && value.trim().length > 0,
                    );
                    if (typeof firstError === "string") {
                        return firstError;
                    }
                }
            }
        }
    }

    if (typeof error === "object" && error !== null && "error" in error) {
        const value = (error as { error?: unknown }).error;
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === "number" || typeof status === "string") {
            return `Не удалось запустить код (HTTP ${status}).`;
        }
    }

    return "Не удалось запустить код.";
};

const getRunResultMessage = (output: string | null, error: string | null): RunState => {
    if (error && error.trim()) {
        return { type: "error", text: error };
    }

    if (output !== null && output.length > 0) {
        return { type: "done", text: output };
    }

    return { type: "done", text: "Программа завершилась без вывода." };
};

export const TaskDescription = ({
    task,
    taskDescription,
    testCases,
    code,
    language,
    duelId,
    taskKey,
    userId,
    canRunCode = true,
}: Props) => {
    const [createCodeRun, { isLoading: isCreating }] = useCreateCodeRunMutation();
    const [fetchCodeRun] = useLazyGetCodeRunQuery();
    const [runInput, setRunInput] = useState("");
    const [runInputDraft, setRunInputDraft] = useState("");
    const [isRunInputEditing, setIsRunInputEditing] = useState(false);
    const [runState, setRunState] = useState<RunState>(DEFAULT_RUN_STATE);
    const [isRunPanelHydrated, setIsRunPanelHydrated] = useState(false);
    const [hydratedRunPanelKey, setHydratedRunPanelKey] = useState<string | null>(null);

    const runPanelRef = useRef<HTMLDivElement | null>(null);
    const runTokensByKeyRef = useRef<Record<string, number>>({});
    const currentRunPanelKeyRef = useRef("");
    const mountedRef = useRef(true);

    const runPanelStorageKey = useMemo(
        () => buildRunPanelStorageKey(duelId, taskKey, task.id),
        [duelId, task.id, taskKey],
    );

    useEffect(() => {
        currentRunPanelKeyRef.current = runPanelStorageKey;
    }, [runPanelStorageKey]);

    const readPersistedRunPanelState = (key: string): PersistedRunPanelState => {
        const fallback = getDefaultPersistedRunPanelState();
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) {
                return fallback;
            }

            const parsed = JSON.parse(raw) as Partial<PersistedRunPanelState>;
            const parsedRunState = parsed.runState;
            const runStateValue: RunState =
                parsedRunState &&
                (parsedRunState.type === "idle" ||
                    parsedRunState.type === "running" ||
                    parsedRunState.type === "done" ||
                    parsedRunState.type === "error") &&
                typeof parsedRunState.text === "string"
                    ? parsedRunState
                    : DEFAULT_RUN_STATE;

            return {
                runInput: typeof parsed.runInput === "string" ? parsed.runInput : "",
                runInputDraft: typeof parsed.runInputDraft === "string" ? parsed.runInputDraft : "",
                isRunInputEditing: Boolean(parsed.isRunInputEditing),
                runState: runStateValue,
            };
        } catch {
            return fallback;
        }
    };

    const persistRunStateForKey = (key: string, nextRunState: RunState) => {
        try {
            const current = readPersistedRunPanelState(key);
            const next: PersistedRunPanelState = {
                ...current,
                runState: nextRunState,
            };
            sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
            // no-op
        }
    };

    useEffect(() => {
        setIsRunPanelHydrated(false);
        setHydratedRunPanelKey(null);

        try {
            const persisted = readPersistedRunPanelState(runPanelStorageKey);
            setRunInput(persisted.runInput);
            setRunInputDraft(persisted.runInputDraft);
            setIsRunInputEditing(persisted.isRunInputEditing);
            setRunState(persisted.runState);
            setIsRunPanelHydrated(true);
            setHydratedRunPanelKey(runPanelStorageKey);
        } catch {
            setRunInput("");
            setRunInputDraft("");
            setIsRunInputEditing(false);
            setRunState(DEFAULT_RUN_STATE);
            setIsRunPanelHydrated(true);
            setHydratedRunPanelKey(runPanelStorageKey);
        }
    }, [runPanelStorageKey]);

    useEffect(() => {
        if (!isRunPanelHydrated || hydratedRunPanelKey !== runPanelStorageKey) {
            return;
        }

        const stateToPersist: PersistedRunPanelState = {
            runInput,
            runInputDraft,
            isRunInputEditing,
            runState,
        };

        try {
            sessionStorage.setItem(runPanelStorageKey, JSON.stringify(stateToPersist));
        } catch {
            // no-op
        }
    }, [
        hydratedRunPanelKey,
        isRunInputEditing,
        isRunPanelHydrated,
        runInput,
        runInputDraft,
        runPanelStorageKey,
        runState,
    ]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const scrollToRunPanel = () => {
        const panelElement = runPanelRef.current;
        if (!panelElement) {
            return;
        }

        panelElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });

        const scrollContainer = getScrollableAncestor(panelElement);
        if (!scrollContainer) {
            return;
        }

        requestAnimationFrame(() => {
            const containerRect = scrollContainer.getBoundingClientRect();
            const panelRect = panelElement.getBoundingClientRect();
            const targetScrollTop =
                scrollContainer.scrollTop + (panelRect.top - containerRect.top) - 12;

            scrollContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: "smooth",
            });
        });
    };

    const runWithInput = async (input: string, source: RunTriggerSource) => {
        const panelKey = runPanelStorageKey;
        const trimmedCode = code.trim();
        if (!trimmedCode) {
            const errorState: RunState = {
                type: "error",
                text: "Сначала введите код в редакторе.",
            };
            persistRunStateForKey(panelKey, errorState);
            setRunState(errorState);
            scrollToRunPanel();
            return;
        }

        const runToken = (runTokensByKeyRef.current[panelKey] ?? 0) + 1;
        runTokensByKeyRef.current[panelKey] = runToken;

        const creatingState: RunState = { type: "running", text: "Создаём запуск..." };
        persistRunStateForKey(panelKey, creatingState);
        if (currentRunPanelKeyRef.current === panelKey) {
            setRunState(creatingState);
        }
        scrollToRunPanel();

        try {
            if (duelId && userId) {
                try {
                    const actionPayload = {
                        duel_id: duelId,
                        user_id: userId,
                        task_key: taskKey ?? undefined,
                    };

                    if (source === "sample") {
                        trackRunSampleTestAction(actionPayload);
                    } else {
                        trackRunCustomTestAction(actionPayload);
                    }
                } catch {
                    // Tracking must not block code execution run.
                }
            }

            const apiLanguage = toApiLanguage(language);
            if (!apiLanguage) {
                throw new Error(`Неподдерживаемый язык: ${language}`);
            }

            if (!duelId || !taskKey) {
                throw new Error("Не удалось определить duel_id или task_key для запуска.");
            }

            const run = await withTimeout(
                createCodeRun({
                    duel_id: duelId,
                    task_key: taskKey,
                    time_limit: task.tl,
                    memory_limit: task.ml,
                    code: trimmedCode,
                    language: apiLanguage,
                    input,
                }).unwrap(),
                REQUEST_TIMEOUT_MS,
                "Сервер долго не отвечает при запуске. Попробуйте ещё раз.",
            );

            const runningState: RunState = { type: "running", text: "Запускаем..." };
            persistRunStateForKey(panelKey, runningState);
            if (currentRunPanelKeyRef.current === panelKey) {
                setRunState(runningState);
            }

            const deadline = Date.now() + POLL_TIMEOUT_MS;

            while (Date.now() < deadline) {
                const status = await withTimeout(
                    fetchCodeRun(run.id, false).unwrap(),
                    REQUEST_TIMEOUT_MS,
                    "Сервер долго не отвечает при проверке статуса запуска.",
                );

                if (runTokensByKeyRef.current[panelKey] !== runToken) {
                    return;
                }

                if (status.status === "Done") {
                    const resultState = getRunResultMessage(status.output, status.error);
                    persistRunStateForKey(panelKey, resultState);
                    if (mountedRef.current && currentRunPanelKeyRef.current === panelKey) {
                        setRunState(resultState);
                    }
                    return;
                }

                await wait(POLL_INTERVAL_MS);
            }

            if (runTokensByKeyRef.current[panelKey] === runToken) {
                const timeoutState: RunState = {
                    type: "error",
                    text: "Превышено время ожидания статуса выполнения. Попробуйте ещё раз.",
                };
                persistRunStateForKey(panelKey, timeoutState);
                if (mountedRef.current && currentRunPanelKeyRef.current === panelKey) {
                    setRunState(timeoutState);
                }
            }
        } catch (error) {
            if (runTokensByKeyRef.current[panelKey] === runToken) {
                const errorState: RunState = { type: "error", text: getErrorMessage(error) };
                persistRunStateForKey(panelKey, errorState);
                if (mountedRef.current && currentRunPanelKeyRef.current === panelKey) {
                    setRunState(errorState);
                }
            }
        }
    };

    const onRunExample = (input: string) => {
        setRunInput(input);
        setRunInputDraft(input);
        setIsRunInputEditing(false);
        void runWithInput(input, "sample");
    };

    const onRunEditedInput = () => {
        const inputToRun = isRunInputEditing ? runInputDraft : runInput;
        if (isRunInputEditing) {
            setRunInput(runInputDraft);
            setIsRunInputEditing(false);
        }

        void runWithInput(inputToRun, "custom");
    };

    const onEditRunInput = () => {
        setRunInputDraft(runInput);
        setIsRunInputEditing(true);
    };

    const onSaveRunInput = () => {
        setRunInput(runInputDraft);
        setIsRunInputEditing(false);
    };

    const isRunning = runState.type === "running" || isCreating;
    const isRunLaunchDisabled = isRunning;

    return (
        <div className={styles.taskDescription}>
            <MarkdownSection content={taskDescription} />

            <Section title="Ограничения">
                <dl className={styles.runtimeLimits}>
                    <dt>Лимит по времени</dt>
                    <dd>{task.tl / 1000} с</dd>
                    <dt>Лимит по памяти</dt>
                    <dd>{task.ml} МБ</dd>
                </dl>
            </Section>

            <Section className={styles.testCases} title="Примеры">
                {testCases?.map((testCase) => (
                    <TestCaseSection
                        key={testCase.order}
                        testCase={testCase}
                        onRun={onRunExample}
                        isRunDisabled={isRunning}
                        canRun={canRunCode}
                    />
                )) ?? "No test cases"}
            </Section>

            {canRunCode && (
                <div ref={runPanelRef}>
                    <Section
                        title="Запуск"
                        titleActionPosition="inline"
                        titleAction={
                            <button
                                type="button"
                                className={styles.runButton}
                                onClick={onRunEditedInput}
                                disabled={isRunLaunchDisabled}
                                aria-label="Запустить"
                                title="Запустить"
                            >
                                <span className={styles.runPlayIcon} />
                            </button>
                        }
                    >
                        <div className={styles.runGrid}>
                            <div className={styles.runColumn}>
                                <div className={styles.runColumnTitle}>Ввод</div>
                                <div className={styles.runInputContainer}>
                                    {isRunInputEditing ? (
                                        <button
                                            type="button"
                                            className={styles.runInputIconButton}
                                            onClick={onSaveRunInput}
                                            disabled={isRunning}
                                            aria-label="Сохранить ввод"
                                        >
                                            <span className={styles.runInputSaveIcon}>✓</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.runInputIconButton}
                                            onClick={onEditRunInput}
                                            disabled={isRunning}
                                            aria-label="Редактировать ввод"
                                        >
                                            <EditIcon />
                                        </button>
                                    )}
                                    {isRunInputEditing ? (
                                        <textarea
                                            className={styles.runInput}
                                            value={runInputDraft}
                                            onChange={(event) =>
                                                setRunInputDraft(event.target.value)
                                            }
                                            placeholder="Введите входные данные"
                                        />
                                    ) : (
                                        <div className={styles.runInputReadOnly}>
                                            <pre>{runInput || ""}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.runColumn}>
                                <div className={styles.runColumnTitle}>Вывод</div>
                                <div
                                    className={
                                        runState.type === "error"
                                            ? `${styles.runOutput} ${styles.runOutputError}`
                                            : styles.runOutput
                                    }
                                >
                                    <pre>{runState.type === "idle" ? "" : runState.text}</pre>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            )}
        </div>
    );
};
