import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DuelSessionState, DuelSessionPhase } from "./types";

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
});

export const { setPhase, setActiveDuelId, setLastEventId, resetDuelSession } =
    duelSessionSlice.actions;
export default duelSessionSlice.reducer;
