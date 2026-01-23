export type DuelTasksOrder = "Sequential" | "Parallel";

export interface DuelTaskConfiguration {
    level: number;
    topics: string[] | null;
}

export interface DuelConfiguration {
    id: number;
    should_show_opponent_solution: boolean;
    max_duration_minutes: number;
    task_count: number;
    task_order: DuelTasksOrder;
    tasks: Record<string, DuelTaskConfiguration> | null;
}

export interface CreateDuelConfigurationRequest {
    should_show_opponent_solution: boolean;
    max_duration_minutes: number;
    tasks_count: number;
    tasks_order: DuelTasksOrder;
    tasks_configurations: Record<string, DuelTaskConfiguration>;
}

export interface UpdateDuelConfigurationRequest {
    should_ShouldShowOpponentSolution: boolean;
    max_duration_minutes: number;
    tasks_count: number;
    tasks_order: DuelTasksOrder;
    tasks_configurations: Record<string, DuelTaskConfiguration>;
}
