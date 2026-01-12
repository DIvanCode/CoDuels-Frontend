import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice } from "entities/duel";
import { DuelSessionState, DuelSessionPhase } from "./types";
import { restoreDuelSession } from "./thunks";

const initialState: DuelSessionState = {
    activeDuelId: null,
    phase: "idle",
    lastEventId: null,
    searchNickname: null,
    searchConfigurationId: null,
    duelCanceled: false,
    duelCanceledOpponentNickname: null,
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
        setActiveDuelId: (state, action: PayloadAction<number | null>) => {
            state.activeDuelId = action.payload;
            if (action.payload) {
                if (state.phase === "searching" || state.phase === "idle") {
                    state.phase = "active";
                }
                state.searchNickname = null;
                state.searchConfigurationId = null;
            } else {
                state.lastEventId = null;
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
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            duelApiSlice.endpoints.getCurrentDuel.matchFulfilled,
            (state, { payload }) => {
                state.activeDuelId = payload.id;
                restoreDuelSession(state.activeDuelId);
            },
        );
    },
});

export const {
    setPhase,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setActiveDuelId,
    setLastEventId,
    setSearchNickname,
    setSearchConfigurationId,
    resetDuelSession,
} = duelSessionSlice.actions;
export default duelSessionSlice.reducer;
