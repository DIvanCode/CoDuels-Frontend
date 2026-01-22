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
    newTasksAvailable: boolean;
    duelStatusChanged: boolean;
    sessionInterrupted: boolean;
}

export type DuelSessionPhase = "idle" | "searching" | "active";
