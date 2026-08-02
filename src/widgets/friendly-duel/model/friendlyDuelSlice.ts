import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { FriendlyDuelCancellationReason, FriendlyDuelError, FriendlyDuelState } from "./types";

const initialState: FriendlyDuelState = {
    ownerUserId: null,
    status: "idle",
    step: "configuration",
    nickname: "",
    configurationId: null,
    usesDefaultConfiguration: true,
    isCanceling: false,
    cancellationReason: null,
    error: null,
};

const resetToIdle = (state: FriendlyDuelState) => {
    state.status = "idle";
    state.step = "configuration";
    state.nickname = "";
    state.configurationId = null;
    state.usesDefaultConfiguration = true;
    state.isCanceling = false;
    state.cancellationReason = null;
    state.error = null;
};

const friendlyDuelSlice = createSlice({
    name: "friendlyDuel",
    initialState,
    reducers: {
        setFriendlyDuelUserId: (state, action: PayloadAction<number | null>) => {
            if (state.ownerUserId === action.payload) return;

            resetToIdle(state);
            state.ownerUserId = action.payload;
        },
        openFriendlyDuel: (state) => {
            resetToIdle(state);
            state.status = "configuring";
        },
        closeFriendlyDuel: (state) => {
            resetToIdle(state);
        },
        selectFriendlyDuelConfiguration: (state, action: PayloadAction<number>) => {
            if (state.status !== "configuring") return;
            state.configurationId = action.payload;
            state.usesDefaultConfiguration = false;
        },
        selectFriendlyDuelDefaultConfiguration: (state) => {
            if (state.status !== "configuring") return;
            state.configurationId = null;
            state.usesDefaultConfiguration = true;
        },
        showFriendlyDuelOpponentStep: (state) => {
            if (state.status !== "configuring") return;
            if (!state.usesDefaultConfiguration && state.configurationId === null) return;
            state.step = "opponent";
        },
        showFriendlyDuelConfigurationStep: (state) => {
            if (state.status !== "configuring") return;
            state.step = "configuration";
        },
        setFriendlyDuelNickname: (state, action: PayloadAction<string>) => {
            if (state.status !== "configuring") return;
            state.nickname = action.payload;
        },
        beginFriendlyDuelPending: (state) => {
            if (state.status !== "configuring" || !state.nickname.trim()) return;
            state.status = "pending";
            state.isCanceling = false;
            state.cancellationReason = null;
            state.error = null;
        },
        restoreFriendlyDuelPending: (
            state,
            action: PayloadAction<{ nickname: string; configurationId: number | null }>,
        ) => {
            if (state.status !== "idle") return;
            state.status = "pending";
            state.step = "opponent";
            state.nickname = action.payload.nickname;
            state.configurationId = action.payload.configurationId;
            state.usesDefaultConfiguration = action.payload.configurationId === null;
            state.isCanceling = false;
            state.cancellationReason = null;
            state.error = null;
        },
        matchFriendlyDuel: (state) => {
            if (state.status !== "pending") return;
            state.status = "matched";
            state.isCanceling = false;
            state.error = null;
        },
        requestFriendlyDuelCancellation: (state) => {
            if (state.status !== "pending" || state.isCanceling) return;
            state.isCanceling = true;
            state.error = null;
        },
        cancelFriendlyDuel: (state, action: PayloadAction<FriendlyDuelCancellationReason>) => {
            if (state.status !== "pending") return;
            state.status = "canceled";
            state.isCanceling = false;
            state.cancellationReason = action.payload;
            state.error = null;
        },
        failFriendlyDuelCancellation: (state, action: PayloadAction<FriendlyDuelError>) => {
            if (state.status !== "pending") return;
            state.isCanceling = false;
            state.error = action.payload;
        },
        failFriendlyDuelCreation: (state, action: PayloadAction<FriendlyDuelError>) => {
            if (state.status !== "configuring" && state.status !== "pending") return;
            state.status = "error";
            state.isCanceling = false;
            state.error = action.payload;
        },
        returnToFriendlyDuelConfiguration: (state) => {
            if (state.status !== "canceled" && state.status !== "error") return;
            state.status = "configuring";
            state.step = "opponent";
            state.isCanceling = false;
            state.cancellationReason = null;
            state.error = null;
        },
        clearFriendlyDuelError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase("auth/logout", (state) => {
            resetToIdle(state);
            state.ownerUserId = null;
        });
    },
});

export const {
    setFriendlyDuelUserId,
    openFriendlyDuel,
    closeFriendlyDuel,
    selectFriendlyDuelConfiguration,
    selectFriendlyDuelDefaultConfiguration,
    showFriendlyDuelOpponentStep,
    showFriendlyDuelConfigurationStep,
    setFriendlyDuelNickname,
    beginFriendlyDuelPending,
    restoreFriendlyDuelPending,
    matchFriendlyDuel,
    requestFriendlyDuelCancellation,
    cancelFriendlyDuel,
    failFriendlyDuelCancellation,
    failFriendlyDuelCreation,
    returnToFriendlyDuelConfiguration,
    clearFriendlyDuelError,
} = friendlyDuelSlice.actions;

export default friendlyDuelSlice.reducer;
