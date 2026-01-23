import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
    DuelConfiguration,
    DuelTaskConfiguration,
    DuelTasksOrder,
    useCreateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
    useUpdateDuelConfigurationMutation,
} from "entities/duel-configuration";
import { useGetTaskTopicsQuery } from "entities/task";
import { useLocalStorage } from "shared/lib/useLocalStorage";
import { Button, Select } from "shared/ui";
import inputStyles from "shared/ui/InputField/InputField.module.scss";

import styles from "./DuelConfigurationManager.module.scss";

interface TaskFormState {
    id: string;
    level: string;
    topics: string[];
}

interface StoredDuelConfiguration {
    id: number;
    should_show_opponent_solution: boolean;
    max_duration_minutes: number;
    tasks_count: number;
    tasks_order: DuelTasksOrder;
    tasks_configurations: Record<string, DuelTaskConfiguration>;
}

const DEFAULT_DURATION_MINUTES = "30";

const LEVEL_OPTIONS = Array.from({ length: 10 }, (_, index) => {
    const value = String(index + 1);
    return { value, label: value };
});

const TASK_ORDER_OPTIONS: Array<{
    value: DuelTasksOrder;
    description: string;
}> = [
    {
        value: "Sequential",
        description: "Задачи открываются одна за другой.",
    },
    {
        value: "Parallel",
        description: "Все задачи доступны сразу.",
    },
];

const createTask = (): TaskFormState => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level: "1",
    topics: [],
});

const buildTaskConfigurations = (tasks: TaskFormState[]) => {
    return tasks.reduce<Record<string, DuelTaskConfiguration>>((acc, task, index) => {
        const taskKey = String.fromCharCode(65 + index);
        acc[taskKey] = {
            level: Number(task.level),
            topics: task.topics.length > 0 ? task.topics : [],
        };

        return acc;
    }, {});
};

const taskKeyToIndex = (key: string) => {
    const normalizedKey = key.trim().toUpperCase();
    const asNumber = Number(normalizedKey);

    if (Number.isFinite(asNumber)) {
        return asNumber;
    }

    const code = normalizedKey.charCodeAt(0);
    if (code >= 65 && code <= 90) {
        return code - 64;
    }

    return Number.MAX_SAFE_INTEGER;
};

const orderLabels: Record<DuelTasksOrder, string> = {
    Sequential: "Задачи открываются одна за другой.",
    Parallel: "Все задачи доступны сразу.",
};

interface Props {
    mode?: "full" | "modalOnly";
    forceFormOpen?: boolean;
    onForceFormClose?: () => void;
    editConfig?: DuelConfiguration | null;
    onCreated?: (config: DuelConfiguration) => void;
}

export const DuelConfigurationManager = ({
    mode = "full",
    forceFormOpen,
    onForceFormClose,
    editConfig,
    onCreated,
}: Props) => {
    const { data: topicsData } = useGetTaskTopicsQuery();
    const [configs, setConfigs] = useLocalStorage<StoredDuelConfiguration[]>(
        "duel-configurations",
        [],
    );
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [maxDurationMinutes, setMaxDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
    const [tasksOrder, setTasksOrder] = useState<DuelTasksOrder>("Sequential");
    const [shouldShowOpponentSolution, setShouldShowOpponentSolution] = useState(true);
    const [tasks, setTasks] = useState<TaskFormState[]>([createTask()]);
    const [formError, setFormError] = useState<string | null>(null);

    const [createConfiguration, { isLoading: isCreating }] = useCreateDuelConfigurationMutation();
    const [updateConfiguration, { isLoading: isUpdating }] = useUpdateDuelConfigurationMutation();
    const [deleteConfiguration, { isLoading: isDeleting }] = useDeleteDuelConfigurationMutation();

    const isSubmitting = isCreating || isUpdating;

    const taskCount = tasks.length;

    const headerLabel = editingId ? "Редактирование правил" : "Создать новые правила";

    const formTaskSummary = useMemo(() => {
        return tasks.map((task, index) => {
            const taskKey = String.fromCharCode(65 + index);
            const topicText = task.topics.length > 0 ? ` | ${task.topics.join(", ")}` : "";
            return `${taskKey}: уровень ${task.level}${topicText}`;
        });
    }, [tasks]);

    const resetForm = () => {
        setEditingId(null);
        setMaxDurationMinutes(DEFAULT_DURATION_MINUTES);
        setTasksOrder("Sequential");
        setShouldShowOpponentSolution(true);
        setTasks([createTask()]);
        setFormError(null);
    };

    useEffect(() => {
        if (forceFormOpen) {
            resetForm();
        }
    }, [forceFormOpen]);

    const closeForm = () => {
        resetForm();
        if (forceFormOpen !== undefined) {
            onForceFormClose?.();
            return;
        }
        setIsFormOpen(false);
    };

    const handleCreateClick = () => {
        resetForm();
        if (forceFormOpen === undefined) {
            setIsFormOpen(true);
        }
    };

    const applyConfigToForm = (config: StoredDuelConfiguration) => {
        const entries = Object.entries(config.tasks_configurations ?? {});
        const sortedEntries = entries.sort(
            ([leftKey], [rightKey]) => taskKeyToIndex(leftKey) - taskKeyToIndex(rightKey),
        );

        const nextTasks = sortedEntries.map(([key, task]) => ({
            id: `${config.id}-${key}`,
            level: String(task.level ?? 1),
            topics: task.topics ?? [],
        }));

        setEditingId(config.id);
        setMaxDurationMinutes(String(config.max_duration_minutes));
        setTasksOrder(config.tasks_order);
        setShouldShowOpponentSolution(config.should_show_opponent_solution);
        setTasks(nextTasks.length > 0 ? nextTasks : [createTask()]);
        setFormError(null);
    };

    const handleEdit = (config: StoredDuelConfiguration) => {
        applyConfigToForm(config);
        if (forceFormOpen === undefined) {
            setIsFormOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить правила дуэли?")) {
            return;
        }

        try {
            await deleteConfiguration(id).unwrap();
            setConfigs((prev) => prev.filter((config) => config.id !== id));
        } catch {
            setFormError("Не удалось удалить правила. Попробуйте снова.");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const duration = Number(maxDurationMinutes);
        if (!Number.isFinite(duration) || duration <= 0) {
            setFormError("Укажите корректную длительность.");
            return;
        }

        if (tasks.length === 0) {
            setFormError("Добавьте хотя бы одну задачу.");
            return;
        }

        if (tasks.some((task) => Number(task.level) <= 0 || Number.isNaN(Number(task.level)))) {
            setFormError("Для каждой задачи выберите уровень от 1 до 10.");
            return;
        }

        const taskConfigurations = buildTaskConfigurations(tasks);
        const payloadBase = {
            max_duration_minutes: duration,
            tasks_count: taskCount,
            tasks_order: tasksOrder,
            tasks_configurations: taskConfigurations,
        };

        try {
            if (editingId) {
                const response = await updateConfiguration({
                    id: editingId,
                    body: {
                        ...payloadBase,
                        should_ShouldShowOpponentSolution: shouldShowOpponentSolution,
                    },
                }).unwrap();

                setConfigs((prev) =>
                    prev.map((config) =>
                        config.id === editingId
                            ? {
                                  id: response.id,
                                  should_show_opponent_solution:
                                      response.should_show_opponent_solution,
                                  max_duration_minutes: response.max_duration_minutes,
                                  tasks_count: response.task_count,
                                  tasks_order: response.task_order,
                                  tasks_configurations: taskConfigurations,
                              }
                            : config,
                    ),
                );
            } else {
                const response = await createConfiguration({
                    ...payloadBase,
                    should_show_opponent_solution: shouldShowOpponentSolution,
                }).unwrap();

                setConfigs((prev) => [
                    ...prev,
                    {
                        id: response.id,
                        should_show_opponent_solution: response.should_show_opponent_solution,
                        max_duration_minutes: response.max_duration_minutes,
                        tasks_count: response.task_count,
                        tasks_order: response.task_order,
                        tasks_configurations: taskConfigurations,
                    },
                ]);
                onCreated?.(response);
            }

            closeForm();
        } catch {
            setFormError("Не удалось сохранить правила. Попробуйте снова.");
        }
    };

    useEffect(() => {
        if (!editConfig) return;

        const mappedConfig: StoredDuelConfiguration = {
            id: editConfig.id,
            should_show_opponent_solution: editConfig.should_show_opponent_solution,
            max_duration_minutes: editConfig.max_duration_minutes,
            tasks_count: editConfig.task_count,
            tasks_order: editConfig.task_order,
            tasks_configurations: editConfig.tasks ?? {},
        };

        setEditingId(editConfig.id);
        applyConfigToForm(mappedConfig);
        setIsFormOpen(true);
    }, [editConfig]);

    const isFormVisible = forceFormOpen ?? isFormOpen;
    const portalTarget: Element | DocumentFragment | null =
        typeof document !== "undefined" ? (document.querySelector(".app") ?? document.body) : null;

    return (
        <>
            {mode === "full" && (
                <div className={styles.card}>
                    <div className={styles.listHeader}>
                        <div className={styles.listHeaderText}>
                            <h2>Ваши правила</h2>
                            <p className={styles.listHint}>
                                Здесь можно управлять своими параметрами дуэли.
                            </p>
                        </div>
                        <Button
                            variant="outlined"
                            className={styles.inlineButton}
                            onClick={handleCreateClick}
                            type="button"
                            leadingIcon={<span className={styles.plusIcon}>+</span>}
                        >
                            Новые правила
                        </Button>
                    </div>

                    {configs.length === 0 ? (
                        <p className={styles.emptyState}>Пока нет созданных правил.</p>
                    ) : (
                        <div className={styles.configList}>
                            {configs.map((config) => {
                                const orderLabel =
                                    orderLabels[config.tasks_order] ??
                                    `Порядок: ${config.tasks_order}`;
                                const tasksEntries = Object.entries(
                                    config.tasks_configurations ?? {},
                                ).sort(
                                    ([leftKey], [rightKey]) =>
                                        taskKeyToIndex(leftKey) - taskKeyToIndex(rightKey),
                                );
                                const taskSummary = tasksEntries.map(([, task], index) => {
                                    const taskKey = String.fromCharCode(65 + index);
                                    const topics =
                                        task.topics && task.topics.length > 0
                                            ? ` | ${task.topics.join(", ")}`
                                            : "";
                                    return `${taskKey}: уровень ${task.level}${topics}`;
                                });

                                return (
                                    <div key={config.id} className={styles.configItem}>
                                        <div className={styles.configSummary}>
                                            <div className={styles.configMeta}>
                                                Длительность: {config.max_duration_minutes} мин
                                            </div>
                                            <div className={styles.configMeta}>
                                                {config.should_show_opponent_solution
                                                    ? "Показывать код соперника во время дуэли"
                                                    : "Не показывать код соперника во время дуэли"}
                                            </div>
                                            <div className={styles.configMeta}>{orderLabel}</div>
                                            {taskSummary.length > 0 && (
                                                <div className={styles.taskSummary}>
                                                    {taskSummary.map((item) => (
                                                        <div key={item}>{item}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.actionGroup}>
                                            <Button
                                                variant="outlined"
                                                className={styles.actionButton}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleEdit(config);
                                                }}
                                                type="button"
                                            >
                                                Изменить
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                className={styles.actionButton}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(config.id);
                                                }}
                                                type="button"
                                                disabled={isDeleting}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {isFormVisible &&
                portalTarget &&
                createPortal(
                    <div className={styles.modalBackdrop} onClick={closeForm}>
                        <div
                            className={styles.modalCard}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>{headerLabel}</h2>
                                <Button
                                    variant="outlined"
                                    className={styles.inlineButton}
                                    onClick={closeForm}
                                    type="button"
                                >
                                    Закрыть
                                </Button>
                            </div>

                            <p className={styles.notice}>
                                Созданные правила подходят только для нерейтинговых дуэлей.
                            </p>

                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={styles.formRow}>
                                    <div className={inputStyles.inputField}>
                                        <input
                                            id="duel-duration"
                                            className={inputStyles.input}
                                            type="number"
                                            min={1}
                                            value={maxDurationMinutes}
                                            onChange={(event) =>
                                                setMaxDurationMinutes(event.target.value)
                                            }
                                            required
                                        />
                                        <span
                                            className={`${inputStyles.inputLabel} ${styles.mutedLabel}`}
                                        >
                                            Длительность (минуты)
                                        </span>
                                    </div>
                                </div>

                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={shouldShowOpponentSolution}
                                        onChange={(event) =>
                                            setShouldShowOpponentSolution(event.target.checked)
                                        }
                                    />
                                    Показывать код соперника во время дуэли
                                </label>

                                <div className={styles.orderGroup}>
                                    <span className={styles.sectionLabel}>Порядок задач</span>
                                    <div className={styles.orderOptions}>
                                        {TASK_ORDER_OPTIONS.map((option) => (
                                            <label
                                                key={option.value}
                                                className={styles.orderOption}
                                            >
                                                <input
                                                    type="radio"
                                                    name="task-order"
                                                    value={option.value}
                                                    checked={tasksOrder === option.value}
                                                    onChange={() => setTasksOrder(option.value)}
                                                />
                                                <div className={styles.orderText}>
                                                    <span className={styles.orderHintOnly}>
                                                        {option.description}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.taskList}>
                                    <div className={styles.taskHeader}>
                                        <h3>Задачи ({taskCount})</h3>
                                        <Button
                                            variant="outlined"
                                            className={styles.inlineButton}
                                            onClick={() =>
                                                setTasks((prev) => [...prev, createTask()])
                                            }
                                            type="button"
                                        >
                                            Добавить задачу
                                        </Button>
                                    </div>

                                    {tasks.map((task) => {
                                        const topics =
                                            topicsData?.status === "OK"
                                                ? (topicsData.topics ?? [])
                                                : [];
                                        const availableTopics = topics.filter(
                                            (topic) => !task.topics.includes(topic),
                                        );
                                        const topicOptions = availableTopics.map((topic) => ({
                                            value: topic,
                                            label: topic,
                                        }));

                                        return (
                                            <div key={task.id} className={styles.taskRow}>
                                                <div className={styles.selectField}>
                                                    <span className={styles.selectLabel}>
                                                        Уровень задачи
                                                    </span>
                                                    <Select
                                                        value={task.level}
                                                        onChange={(value) => {
                                                            setTasks((prev) =>
                                                                prev.map((item) =>
                                                                    item.id === task.id
                                                                        ? { ...item, level: value }
                                                                        : item,
                                                                ),
                                                            );
                                                        }}
                                                        options={LEVEL_OPTIONS}
                                                        className={styles.select}
                                                    />
                                                </div>

                                                <div className={styles.topics}>
                                                    <span className={styles.selectLabel}>
                                                        Темы задач
                                                    </span>
                                                    {task.topics.length > 0 && (
                                                        <div className={styles.topicList}>
                                                            {task.topics.map((topic) => (
                                                                <div
                                                                    key={topic}
                                                                    className={styles.topicChip}
                                                                >
                                                                    <span>{topic}</span>
                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            styles.topicRemove
                                                                        }
                                                                        onClick={() => {
                                                                            setTasks((prev) =>
                                                                                prev.map((item) =>
                                                                                    item.id ===
                                                                                    task.id
                                                                                        ? {
                                                                                              ...item,
                                                                                              topics: item.topics.filter(
                                                                                                  (
                                                                                                      itemTopic,
                                                                                                  ) =>
                                                                                                      itemTopic !==
                                                                                                      topic,
                                                                                              ),
                                                                                          }
                                                                                        : item,
                                                                                ),
                                                                            );
                                                                        }}
                                                                    >
                                                                        Удалить
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <Select
                                                        value={""}
                                                        onChange={(value) => {
                                                            setTasks((prev) =>
                                                                prev.map((item) =>
                                                                    item.id === task.id
                                                                        ? {
                                                                              ...item,
                                                                              topics: item.topics.includes(
                                                                                  value,
                                                                              )
                                                                                  ? item.topics
                                                                                  : [
                                                                                        ...item.topics,
                                                                                        value,
                                                                                    ],
                                                                          }
                                                                        : item,
                                                                ),
                                                            );
                                                        }}
                                                        options={topicOptions}
                                                        className={styles.select}
                                                        placeholder={
                                                            task.topics.length > 0
                                                                ? "выбрать тему"
                                                                : "любая тема"
                                                        }
                                                    />
                                                </div>

                                                <Button
                                                    variant="outlined"
                                                    className={styles.inlineButton}
                                                    onClick={() =>
                                                        setTasks((prev) =>
                                                            prev.filter(
                                                                (item) => item.id !== task.id,
                                                            ),
                                                        )
                                                    }
                                                    type="button"
                                                    disabled={tasks.length === 1}
                                                >
                                                    Удалить задачу
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {formTaskSummary.length > 0 && (
                                    <div className={styles.helperText}>
                                        {formTaskSummary.map((item) => (
                                            <div key={item}>{item}</div>
                                        ))}
                                    </div>
                                )}

                                {formError && <p className={styles.errorText}>{formError}</p>}

                                <Button type="submit" disabled={isSubmitting}>
                                    {editingId ? "Сохранить изменения" : "Создать правила"}
                                </Button>
                            </form>
                        </div>
                    </div>,
                    portalTarget,
                )}
        </>
    );
};
