export interface DuelMessage {
    duel_id: string;
    winner_user_id?: string;
}

export interface DuelSessionState {
    activeDuelId: string | null;
    phase: DuelSessionPhase;
}

export type DuelSessionPhase = "idle" | "searching" | "active";
