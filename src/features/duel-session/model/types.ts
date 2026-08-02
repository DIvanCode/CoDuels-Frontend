import type { PendingDuelType } from "entities/duel-invitation";

export interface DuelMessage {
    duel_id: number;
}

export interface PendingDuelResult {
    duelId: number;
    userId: number;
}

export interface DuelSessionState {
    activeDuelId: number | null;
    activeDuelUserId: number | null;
    phase: DuelSessionPhase;
    pendingStartedInCurrentRuntime: boolean;
    duelStartFenceExpiresAt: number | null;
    lastEventId: string | null;
    searchNickname: string | null;
    searchConfigurationId: number | null;
    searchInvitationType: PendingDuelType | null;
    searchTournamentId: number | null;
    duelCanceled: boolean;
    duelCanceledOpponentNickname: string | null;
    duelStatusChanged: boolean;
    sessionInterrupted: boolean;
    lastTasksByDuelId: Record<number, Record<string, string | null> | null>;
    openedTaskKeys: string[];
    pendingResult: PendingDuelResult | null;
}

export type DuelSessionPhase = "idle" | "searching" | "active";
