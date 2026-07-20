import { createAsyncThunk } from "@reduxjs/toolkit";

import { duelApiSlice, getActiveDuelId } from "entities/duel";

import {
    beginDuelSessionRestore,
    confirmDuelStarted,
    reconcileDuelSessionFailed,
    reconcileDuelSessionSucceeded,
} from "./duelSessionSlice";
import type { DuelSessionEventMetadata } from "./types";

const isNotFoundError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404;

const requestActiveDuelId = async (dispatch: AppDispatch) => {
    try {
        const activeDuel = await dispatch(
            duelApiSlice.endpoints.getActiveDuel.initiate(undefined, {
                forceRefetch: true,
                subscribe: false,
            }),
        ).unwrap();
        return getActiveDuelId(activeDuel);
    } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
    }
};

const requestInProgressDuelId = async (dispatch: AppDispatch, duelId: number) => {
    try {
        const duel = await dispatch(
            duelApiSlice.endpoints.getDuel.initiate(duelId, {
                forceRefetch: true,
                subscribe: false,
            }),
        ).unwrap();
        return duel.status === "InProgress" ? duel.id : null;
    } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
    }
};

export const reconcileDuelSession = createAsyncThunk<
    void,
    void,
    { dispatch: AppDispatch; state: RootState }
>("duelSession/reconcile", async (_, { dispatch, getState }) => {
    const previousDuelId = getState().duelSession.activeDuelId;
    const { generation } = dispatch(beginDuelSessionRestore()).payload;

    try {
        const activeDuelId = await requestActiveDuelId(dispatch);
        const inProgressDuelId = activeDuelId
            ? await requestInProgressDuelId(dispatch, activeDuelId)
            : null;

        if (!activeDuelId && previousDuelId) {
            // Load a duel that finished while the client was offline before clearing its context.
            await requestInProgressDuelId(dispatch, previousDuelId);
        }

        dispatch(
            reconcileDuelSessionSucceeded({
                generation,
                duelId: inProgressDuelId,
            }),
        );
    } catch {
        dispatch(reconcileDuelSessionFailed({ generation }));
    }
});

export const confirmDuelStartedFromServer = createAsyncThunk<
    void,
    { duelId: number; metadata: DuelSessionEventMetadata },
    { dispatch: AppDispatch; state: RootState }
>("duelSession/confirmStartedFromServer", async ({ duelId, metadata }, { dispatch, getState }) => {
    const expectedGeneration = getState().duelSession.generation;

    try {
        const activeDuelId = await requestActiveDuelId(dispatch);
        if (activeDuelId !== duelId) return;

        const inProgressDuelId = await requestInProgressDuelId(dispatch, duelId);
        if (inProgressDuelId !== duelId) return;

        dispatch(
            confirmDuelStarted({
                duelId,
                expectedGeneration,
                ...metadata,
            }),
        );
    } catch {
        // A realtime start is only a hint. Keep the current state when the server cannot confirm it.
    }
});
