import type { Duel } from "entities/duel";

export const doesDuelResultCandidateOwnSession = (
    state: RootState,
    duelId: number,
    userId: number,
) => {
    const { activeDuelId, activeDuelUserId, pendingResult } = state.duelSession;
    const ownsActiveDuel =
        activeDuelId === duelId && (activeDuelUserId === userId || activeDuelUserId === null);
    const ownsPendingResult = pendingResult?.duelId === duelId && pendingResult.userId === userId;

    return ownsActiveDuel || ownsPendingResult;
};

export const getDuelResultCandidateId = (state: RootState, userId: number) => {
    const { activeDuelId, activeDuelUserId, pendingResult } = state.duelSession;

    if (activeDuelId !== null && (activeDuelUserId === userId || activeDuelUserId === null)) {
        return activeDuelId;
    }
    if (pendingResult?.userId === userId) return pendingResult.duelId;
    return null;
};

export const isFinishedDuelResultForUser = (duel: Duel, duelId: number, userId: number) =>
    duel.id === duelId &&
    duel.status === "Finished" &&
    (duel.participants ?? []).some((participant) => participant.id === userId);
