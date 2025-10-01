import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DuelSessionState, DuelSessionPhase } from "./types";

export const initialState: DuelSessionState = {
    activeDuelId: null,
    phase: "idle",
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
        setActiveDuelId: (state, action: PayloadAction<string | null>) => {
            state.activeDuelId = action.payload;
            if (action.payload && state.phase === "searching") {
                state.phase = "active";
            }
        },
    },
});

export const { setPhase, setActiveDuelId } = duelSessionSlice.actions;
export default duelSessionSlice.reducer;
