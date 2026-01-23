export interface DuelParticipant {
    id: number;
    nickname: string;
    rating: number;
    created_at: string;
}

export interface DuelTaskRef {
    id: string | null;
}

export interface DuelTaskSolution {
    solution: string | null;
    language: string;
}

export interface Duel {
    id: number;
    is_rated: boolean;
    should_show_opponent_solution: boolean;
    participants: DuelParticipant[] | null;
    winner_id?: number | null;
    status: "InProgress" | "Finished";
    start_time: string;
    deadline_time: string;
    end_time?: string | null;
    rating_changes: Record<number, DeltaInfo> | null;
    tasks: Record<string, DuelTaskRef> | null;
    solutions?: Record<string, DuelTaskSolution> | null;
    opponent_solutions?: Record<string, DuelTaskSolution> | null;
    task_id?: string;
}

export type DeltaInfo = Record<DuelResultType, number>;

export type DuelResultType = "Win" | "Lose" | "Draw";
