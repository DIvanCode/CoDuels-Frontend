import type { PendingDuelType } from "entities/duel-invitation/model/types";

export interface DuelMessage {
    duel_id: number;
}

export interface DuelSearchContext {
    nickname: string | null;
    configurationId: number | null;
    invitationType: PendingDuelType | null;
    tournamentId: number | null;
}

export interface DuelSessionEventMetadata {
    eventId?: string | null;
    generation?: string | null;
    revision?: number | null;
}

export type DuelSessionOperation = "start" | "cancel" | "restore" | null;

export type ResumableDuelSessionPhase = Exclude<DuelSessionPhase, "interrupted">;

export interface DuelSessionState {
    activeDuelId: number | null;
    phase: DuelSessionPhase;
    generation: string | null;
    pendingOperation: DuelSessionOperation;
    interruptedPhase: ResumableDuelSessionPhase | null;
    lastEventId: string | null;
    lastServerRevision: number | null;
    recentEventIds: string[];
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
}

export type DuelSessionPhase =
    | "idle"
    | "configuring"
    | "searching"
    | "active"
    | "finished"
    | "interrupted";
