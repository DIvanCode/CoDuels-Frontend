export interface Duel {
    id: number;
    status: "InProgress" | "Finished";
    opponent_id: number;
    result?: DuelResultType;
    task_id: string;
    start_time: string;
    deadline_time: string;
    end_time?: number;
}

export type DuelResultType = "Win" | "Lose" | "Draw";
