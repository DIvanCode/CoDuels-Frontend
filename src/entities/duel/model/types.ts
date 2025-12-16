export interface DuelParticipant {
    id: number;
    nickname: string;
    rating: number;
    created_at: number;
}

export interface Duel {
    id: number;
    task_id: string;
    participants: [DuelParticipant, DuelParticipant];
    winner_id?: number;
    status: "InProgress" | "Finished";
    start_time: string;
    deadline_time: string;
    end_time?: number;
    rating_changes: Record<number, DeltaInfo>;
}

export type DeltaInfo = Record<DuelResultType, number>;

export type DuelResultType = "Win" | "Lose" | "Draw";
