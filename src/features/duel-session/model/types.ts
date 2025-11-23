export interface DuelMessage {
    duel_id: number;
}

export interface DuelSessionState {
    activeDuelId: number | null;
    phase: DuelSessionPhase;
    lastEventId: string | null;
}

export type DuelSessionPhase = "idle" | "searching" | "active";
