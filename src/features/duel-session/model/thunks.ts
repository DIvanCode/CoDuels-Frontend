import { createAsyncThunk } from "@reduxjs/toolkit";
import { duelApiSlice } from "entities/duel";
import { resetDuelSession, setActiveDuel } from "./duelSessionSlice";

export const restoreDuelSession = createAsyncThunk<
    void,
    number,
    { dispatch: AppDispatch; state: RootState }
>("duelSession/restore", async (duelId, { dispatch, getState }) => {
    try {
        const result = await dispatch(duelApiSlice.endpoints.getDuel.initiate(duelId));
        const duel = result.data;
        const userId = getState().auth.user?.id;
        const isCurrentUserParticipant = (duel?.participants ?? []).some(
            (participant) => participant.id === userId,
        );

        if (duel?.status === "InProgress" && userId && isCurrentUserParticipant) {
            dispatch(setActiveDuel({ duelId: duel.id, userId }));
        } else {
            dispatch(resetDuelSession());
        }
    } catch {
        dispatch(resetDuelSession());
    }
});
