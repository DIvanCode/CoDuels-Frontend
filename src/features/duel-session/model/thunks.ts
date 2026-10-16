import { createAsyncThunk } from "@reduxjs/toolkit";
import { duelApiSlice } from "entities/duel";
import { finishActiveDuel, resetDuelSession, setActiveDuel } from "./duelSessionSlice";
import { doesDuelResultCandidateOwnSession, isFinishedDuelResultForUser } from "./sessionResult";
import { shouldClearSessionAfterNullActiveDuel } from "./sessionFreshness";

const isUnavailableResult = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    ((error as { status?: number }).status === 403 ||
        (error as { status?: number }).status === 404);

export const restoreDuelSession = createAsyncThunk<
    void,
    number,
    { dispatch: AppDispatch; state: RootState }
>("duelSession/restore", async (duelId, { dispatch, getState, signal }) => {
    const userId = getState().auth.user?.id;
    if (userId === undefined || !doesDuelResultCandidateOwnSession(getState(), duelId, userId)) {
        return;
    }

    const request = dispatch(
        duelApiSlice.endpoints.getDuel.initiate(duelId, {
            forceRefetch: true,
            subscribe: false,
        }),
    );
    const abortRequest = () => request.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    const candidateStillOwnsSession = () =>
        !signal.aborted &&
        getState().auth.user?.id === userId &&
        doesDuelResultCandidateOwnSession(getState(), duelId, userId);

    try {
        const duel = await request.unwrap();
        const isCurrentUserParticipant = (duel?.participants ?? []).some(
            (participant) => participant.id === userId,
        );

        if (!candidateStillOwnsSession()) return;

        if (isFinishedDuelResultForUser(duel, duelId, userId) && isCurrentUserParticipant) {
            dispatch(finishActiveDuel({ duelId, userId }));
        } else {
            dispatch(resetDuelSession());
        }
    } catch (error: unknown) {
        if (isUnavailableResult(error) && candidateStillOwnsSession()) {
            dispatch(resetDuelSession());
        }
    } finally {
        signal.removeEventListener("abort", abortRequest);
        request.unsubscribe();
    }
});

export const restoreActiveDuel = createAsyncThunk<
    void,
    { duelId: number; userId: number },
    { dispatch: AppDispatch; state: RootState }
>("duelSession/restoreActive", async ({ duelId, userId }, { dispatch, getState, signal }) => {
    if (!Number.isSafeInteger(duelId) || duelId <= 0 || getState().auth.user?.id !== userId) {
        return;
    }

    const initialSession = getState().duelSession;
    const isCurrentSession = () =>
        getState().auth.user?.id === userId && getState().auth.token !== null;
    const canApply = () => {
        if (!isCurrentSession() || signal.aborted) return false;
        const current = getState().duelSession;
        return (
            (current.activeDuelId === initialSession.activeDuelId &&
                current.activeDuelUserId === initialSession.activeDuelUserId &&
                current.phase === initialSession.phase &&
                current.pendingResult?.duelId === initialSession.pendingResult?.duelId) ||
            (current.activeDuelId === duelId && current.activeDuelUserId === userId)
        );
    };
    const clearStaleSession = () => {
        if (canApply() && shouldClearSessionAfterNullActiveDuel(getState().duelSession)) {
            dispatch(resetDuelSession());
        }
    };
    const request = dispatch(
        duelApiSlice.endpoints.getDuel.initiate(duelId, {
            forceRefetch: true,
            subscribe: false,
        }),
    );
    const abortRequest = () => request.abort();
    signal.addEventListener("abort", abortRequest, { once: true });

    try {
        const duel = await request.unwrap();
        if (!canApply()) return;
        const isParticipant = (duel.participants ?? []).some(
            (participant) => participant.id === userId,
        );
        if (duel.id === duelId && duel.status === "InProgress" && isParticipant) {
            dispatch(setActiveDuel({ duelId, userId }));
        } else if (isFinishedDuelResultForUser(duel, duelId, userId)) {
            if (doesDuelResultCandidateOwnSession(getState(), duelId, userId)) {
                dispatch(finishActiveDuel({ duelId, userId }));
            } else {
                clearStaleSession();
            }
        } else {
            clearStaleSession();
        }
    } catch (error: unknown) {
        if (isUnavailableResult(error)) clearStaleSession();
    } finally {
        signal.removeEventListener("abort", abortRequest);
        request.unsubscribe();
    }
});
