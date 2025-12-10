import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice } from "entities/duel";
import { DuelSessionState, DuelSessionPhase } from "./types";
import { restoreDuelSession } from "./thunks";

const initialState: DuelSessionState = {
    activeDuelId: null,
    phase: "idle",
    lastEventId: null,
};

const duelSessionSlice = createSlice({
    name: "duelSession",
    initialState,
    reducers: {
        setPhase: (state, action: PayloadAction<DuelSessionPhase>) => {
            state.phase = action.payload;
            if (action.payload === "idle") {
                state.activeDuelId = null;
            }
        },
        setActiveDuelId: (state, action: PayloadAction<number | null>) => {
            state.activeDuelId = action.payload;
            if (action.payload) {
                if (state.phase === "searching" || state.phase === "idle") {
                    state.phase = "active";
                }
            } else {
                state.lastEventId = null;
            }
        },
        setLastEventId: (state, action: PayloadAction<string | null>) => {
            state.lastEventId = action.payload;
        },
        resetDuelSession: (state) => {
            state.activeDuelId = null;
            state.phase = "idle";
            state.lastEventId = null;
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

export const { setPhase, setActiveDuelId, setLastEventId, resetDuelSession } =
    duelSessionSlice.actions;
export default duelSessionSlice.reducer;
