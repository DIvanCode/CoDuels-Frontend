import { createAsyncThunk } from "@reduxjs/toolkit";
import { duelApiSlice } from "entities/duel";
import { finishActiveDuel, resetDuelSession, setActiveDuel } from "./duelSessionSlice";
import { doesDuelResultCandidateOwnSession, isFinishedDuelResultForUser } from "./sessionResult";

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
>("duelSession/restore", async (duelId, { dispatch, getState }) => {
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
    const candidateStillOwnsSession = () =>
        getState().auth.user?.id === userId &&
        doesDuelResultCandidateOwnSession(getState(), duelId, userId);

    try {
        const duel = await request.unwrap();
        const isCurrentUserParticipant = (duel?.participants ?? []).some(
            (participant) => participant.id === userId,
        );

        if (!candidateStillOwnsSession()) return;

        if (duel.status === "InProgress" && isCurrentUserParticipant) {
            dispatch(setActiveDuel({ duelId: duel.id, userId }));
        } else if (isFinishedDuelResultForUser(duel, duelId, userId)) {
            dispatch(finishActiveDuel({ duelId, userId }));
        } else {
            dispatch(resetDuelSession());
        }
    } catch (error: unknown) {
        if (isUnavailableResult(error) && candidateStillOwnsSession()) {
            dispatch(resetDuelSession());
        }
    } finally {
        request.unsubscribe();
    }
});
