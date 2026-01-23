export interface DuelMessage {
    duel_id: number;
}

export interface DuelSessionState {
    activeDuelId: number | null;
    phase: DuelSessionPhase;
    lastEventId: string | null;
    searchNickname: string | null;
    searchConfigurationId: number | null;
    duelCanceled: boolean;
    duelCanceledOpponentNickname: string | null;
    duelStatusChanged: boolean;
    sessionInterrupted: boolean;
    lastTasksByDuelId: Record<number, Record<string, string | null> | null>;
    openedTaskKeys: string[];
}

export type DuelSessionPhase = "idle" | "searching" | "active";
