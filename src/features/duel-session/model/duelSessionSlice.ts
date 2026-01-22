import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice } from "entities/duel";
import { DuelSessionState, DuelSessionPhase } from "./types";
import { restoreDuelSession } from "./thunks";

const isNotFoundError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404;

const initialState: DuelSessionState = {
    activeDuelId: null,
    phase: "idle",
    lastEventId: null,
    searchNickname: null,
    searchConfigurationId: null,
    duelCanceled: false,
    duelCanceledOpponentNickname: null,
    newTasksAvailable: false,
    duelStatusChanged: false,
    sessionInterrupted: false,
};

const duelSessionSlice = createSlice({
    name: "duelSession",
    initialState,
    reducers: {
        setPhase: (state, action: PayloadAction<DuelSessionPhase>) => {
            state.phase = action.payload;
            if (action.payload === "idle") {
                state.activeDuelId = null;
                state.searchNickname = null;
                state.searchConfigurationId = null;
            }
        },
        setDuelCanceled: (state, action: PayloadAction<boolean>) => {
            state.duelCanceled = action.payload;
            if (!action.payload) {
                state.duelCanceledOpponentNickname = null;
            }
        },
        setDuelCanceledOpponentNickname: (state, action: PayloadAction<string | null>) => {
            state.duelCanceledOpponentNickname = action.payload;
        },
        setNewTasksAvailable: (state, action: PayloadAction<boolean>) => {
            state.newTasksAvailable = action.payload;
        },
        setDuelStatusChanged: (state, action: PayloadAction<boolean>) => {
            state.duelStatusChanged = action.payload;
        },
        setSessionInterrupted: (state, action: PayloadAction<boolean>) => {
            state.sessionInterrupted = action.payload;
        },
        setActiveDuelId: (state, action: PayloadAction<number | null>) => {
            state.activeDuelId = action.payload;
            if (action.payload) {
                if (state.phase === "searching" || state.phase === "idle") {
                    state.phase = "active";
                }
                state.searchNickname = null;
                state.searchConfigurationId = null;
                state.newTasksAvailable = false;
                state.duelStatusChanged = false;
            } else {
                state.lastEventId = null;
                state.newTasksAvailable = false;
                state.duelStatusChanged = false;
            }
        },
        setLastEventId: (state, action: PayloadAction<string | null>) => {
            state.lastEventId = action.payload;
        },
        setSearchNickname: (state, action: PayloadAction<string | null>) => {
            state.searchNickname = action.payload;
        },
        setSearchConfigurationId: (state, action: PayloadAction<number | null>) => {
            state.searchConfigurationId = action.payload;
        },
        resetDuelSession: (state) => {
            state.activeDuelId = null;
            state.phase = "idle";
            state.lastEventId = null;
            state.searchNickname = null;
            state.searchConfigurationId = null;
            state.duelCanceled = false;
            state.duelCanceledOpponentNickname = null;
            state.newTasksAvailable = false;
            state.duelStatusChanged = false;
            state.sessionInterrupted = false;
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            duelApiSlice.endpoints.getActiveDuel.matchFulfilled,
            (state, { payload }) => {
                state.activeDuelId = payload.id;
                restoreDuelSession(state.activeDuelId);
            },
        );
        builder.addMatcher(
            duelApiSlice.endpoints.getActiveDuel.matchRejected,
            (state, { payload }) => {
                if (!isNotFoundError(payload)) return;

                if (state.phase === "active") {
                    state.activeDuelId = null;
                    state.phase = "idle";
                    state.lastEventId = null;
                    state.duelCanceled = false;
                    state.duelCanceledOpponentNickname = null;
                    state.newTasksAvailable = false;
                    state.duelStatusChanged = false;
                }
            },
        );
    },
});

export const {
    setPhase,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setNewTasksAvailable,
    setDuelStatusChanged,
    setActiveDuelId,
    setLastEventId,
    setSearchNickname,
    setSearchConfigurationId,
    setSessionInterrupted,
    resetDuelSession,
} = duelSessionSlice.actions;
export default duelSessionSlice.reducer;
