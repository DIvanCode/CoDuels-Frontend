import type { Duel } from "entities/duel";

import { shouldClearSessionAfterActiveDuelNotFound } from "../../model/sessionFreshness";

export const hasStaleActiveSession = (state: RootState) => {
    return shouldClearSessionAfterActiveDuelNotFound(state.duelSession);
};

export const getDuelResultCandidateId = (state: RootState, userId: number) => {
    const { activeDuelId, activeDuelUserId, pendingResult } = state.duelSession;

    if (activeDuelId !== null && activeDuelUserId === userId) return activeDuelId;
    if (pendingResult?.userId === userId) return pendingResult.duelId;
    return null;
};

export const isFinishedDuelResultForUser = (duel: Duel, duelId: number, userId: number) =>
    duel.id === duelId &&
    duel.status === "Finished" &&
    (duel.participants ?? []).some((participant) => participant.id === userId);
