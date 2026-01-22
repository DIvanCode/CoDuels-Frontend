import clsx from "clsx";
import { useState } from "react";

import {
    DuelConfiguration,
    DuelTaskConfiguration,
    DuelTasksOrder,
    useDeleteDuelConfigurationMutation,
    useGetDuelConfigurationsQuery,
} from "entities/duel-configuration";
import { Button, Modal } from "shared/ui";

import styles from "./DuelConfigurationManager.module.scss";

interface StoredDuelConfiguration {
    id: number;
    should_show_opponent_solution: boolean;
    max_duration_minutes: number;
    tasks_count: number;
    tasks_order: DuelTasksOrder;
    tasks_configurations: Record<string, DuelTaskConfiguration>;
}

interface Props {
    selectedId: number | null;
    selectedIsDefault?: boolean;
    onSelect: (id: number) => void;
    onSelectDefault?: () => void;
    onClearSelection?: () => void;
    onCreate?: () => void;
    onEdit?: (config: DuelConfiguration) => void;
    className?: string;
}

const orderLabels: Record<DuelTasksOrder, string> = {
    Sequential: "Задачи открываются одна за другой.",
    Parallel: "Все задачи доступны сразу.",
};

export const DuelConfigurationPicker = ({
    selectedId,
    selectedIsDefault,
    onSelect,
    onSelectDefault,
    onClearSelection,
    onCreate,
    onEdit,
    className,
}: Props) => {
    const { data: configs, isLoading, isError } = useGetDuelConfigurationsQuery();
    const [deleteConfiguration, { isLoading: isDeleting }] = useDeleteDuelConfigurationMutation();
    const [pendingDelete, setPendingDelete] = useState<StoredDuelConfiguration | null>(null);
    const normalizedConfigs: StoredDuelConfiguration[] =
        configs?.map((config: DuelConfiguration) => ({
            id: config.id,
            should_show_opponent_solution: config.should_show_opponent_solution,
            max_duration_minutes: config.max_duration_minutes,
            tasks_count: config.task_count,
            tasks_order: config.task_order,
            tasks_configurations: config.tasks ?? {},
        })) ?? [];

    const toDuelConfiguration = (config: StoredDuelConfiguration): DuelConfiguration => ({
        id: config.id,
        should_show_opponent_solution: config.should_show_opponent_solution,
        max_duration_minutes: config.max_duration_minutes,
        task_count: config.tasks_count,
        task_order: config.tasks_order,
        tasks: config.tasks_configurations,
    });

    return (
        <div className={clsx(styles.card, className)}>
            <div className={clsx(styles.listHeader, styles.listHeaderStack)}>
                <div className={clsx(styles.listHeaderText, styles.listHeaderCentered)}>
                    <h2>Правила дуэли</h2>
                    <p className={styles.listHint}>
                        Выберите правила для дуэли или используйте стандартные.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <p className={styles.emptyState}>Загрузка правил...</p>
            ) : (
                <>
                    {onSelectDefault && (
                        <button
                            type="button"
                            className={clsx(
                                styles.configItem,
                                styles.configItemSelectable,
                                styles.defaultConfigItem,
                                selectedIsDefault && styles.configItemSelected,
                            )}
                            onClick={onSelectDefault}
                        >
                            <div className={styles.configSummary}>
                                <div className={styles.configTitle}>Стандартные правила</div>
                                <div className={styles.configMeta}>Длительность: 30 минут</div>
                                <div className={styles.configMeta}>
                                    Показывать код соперника во время дуэли.
                                </div>
                                <div className={styles.configMeta}>Одна задача.</div>
                                <div className={styles.taskSummary}>
                                    <div>Уровень определяется автоматически.</div>
                                </div>
                            </div>
                        </button>
                    )}
                    {onCreate && (
                        <div className={styles.listHeaderActionsLeft}>
                            <Button
                                variant="outlined"
                                className={styles.inlineButton}
                                onClick={onCreate}
                                type="button"
                                leadingIcon={<span className={styles.plusIcon}>+</span>}
                            >
                                Новые правила
                            </Button>
                        </div>
                    )}
                    {isError ? (
                        <p className={styles.emptyState}>Не удалось загрузить правила.</p>
                    ) : normalizedConfigs.length === 0 ? (
                        <p className={styles.emptyState}>Пока нет созданных правил.</p>
                    ) : (
                        <div className={styles.configList}>
                            {normalizedConfigs.map((config) => {
                                const orderLabel =
                                    orderLabels[config.tasks_order] ??
                                    `Порядок: ${config.tasks_order}`;
                                const tasksEntries = Object.entries(
                                    config.tasks_configurations ?? {},
                                ).sort(
                                    ([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey),
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
                                    <button
                                        key={config.id}
                                        type="button"
                                        className={clsx(
                                            styles.configItem,
                                            styles.configItemSelectable,
                                            selectedId === config.id && styles.configItemSelected,
                                        )}
                                        onClick={() => onSelect(config.id)}
                                    >
                                        <div className={styles.configSummary}>
                                            <div className={styles.configMeta}>
                                                Длительность: {config.max_duration_minutes} мин
                                            </div>
                                            <div className={styles.configMeta}>
                                                {config.should_show_opponent_solution
                                                    ? "Показывать код соперника во время дуэли."
                                                    : "Не показывать код соперника во время дуэли."}
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
                                                    onEdit?.(toDuelConfiguration(config));
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
                                                    setPendingDelete(config);
                                                }}
                                                type="button"
                                                disabled={isDeleting}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {pendingDelete && (
                <Modal title="Удалить правила?" onClose={() => setPendingDelete(null)}>
                    <p className={styles.deleteHint}>Действие необратимо. Правила будут удалены.</p>
                    <div className={styles.deleteActions}>
                        <Button
                            variant="outlined"
                            onClick={() => setPendingDelete(null)}
                            type="button"
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!pendingDelete) return;
                                await deleteConfiguration(pendingDelete.id).unwrap();
                                if (selectedId === pendingDelete.id) {
                                    onClearSelection?.();
                                }
                                setPendingDelete(null);
                            }}
                            disabled={isDeleting}
                            type="button"
                        >
                            Удалить
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
