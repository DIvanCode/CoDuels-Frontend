import { createAsyncThunk } from "@reduxjs/toolkit";
import { duelApiSlice } from "entities/duel";
import { resetDuelSession, setActiveDuelId } from "./duelSessionSlice";

export const restoreDuelSession = createAsyncThunk<void, number, { dispatch: AppDispatch }>(
    "duelSession/restore",
    async (duelId, { dispatch }) => {
        try {
            const result = await dispatch(duelApiSlice.endpoints.getDuel.initiate(duelId));
            const duel = result.data;

            if (duel?.status === "InProgress") {
                dispatch(setActiveDuelId(duel.id));
            } else {
                dispatch(resetDuelSession());
            }
        } catch {
            dispatch(resetDuelSession());
        }
    },
);
