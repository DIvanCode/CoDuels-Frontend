export interface Duel {
    id: string;
    opponent_user_id: string;
    status: "in_progress" | "finished";
    task_id: string;
    starts_at: string;
    deadline_at: string;
    winner_user_id?: string;
}
