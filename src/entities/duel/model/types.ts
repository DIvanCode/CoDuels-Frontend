export interface Duel {
    id: number;
    opponent_user_id: number;
    status: "in_progress" | "finished";
    task_id: string;
    starts_at: string;
    deadline_at: string;
    winner_user_id?: number;
}
