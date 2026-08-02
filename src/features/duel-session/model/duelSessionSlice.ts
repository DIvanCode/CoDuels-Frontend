import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice, type DuelTaskRef } from "entities/duel";
import type { PendingDuelType } from "entities/duel-invitation";
import { shouldClearSessionAfterActiveDuelNotFound } from "./sessionFreshness";
import { DuelSessionState, DuelSessionPhase } from "./types";

const isNotFoundError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404;

const initialState: DuelSessionState = {
    activeDuelId: null,
    activeDuelUserId: null,
    phase: "idle",
    pendingStartedInCurrentRuntime: false,
    lastEventId: null,
    searchNickname: null,
    searchConfigurationId: null,
    searchInvitationType: null,
    searchTournamentId: null,
    duelCanceled: false,
    duelCanceledOpponentNickname: null,
    duelStatusChanged: false,
    sessionInterrupted: false,
    lastTasksByDuelId: {},
    openedTaskKeys: [],
    pendingResult: null,
};

const clearDuelSession = (state: DuelSessionState) => {
    state.activeDuelId = null;
    state.activeDuelUserId = null;
    state.phase = "idle";
    state.pendingStartedInCurrentRuntime = false;
    state.lastEventId = null;
    state.searchNickname = null;
    state.searchConfigurationId = null;
    state.searchInvitationType = null;
    state.searchTournamentId = null;
    state.duelCanceled = false;
    state.duelCanceledOpponentNickname = null;
    state.duelStatusChanged = false;
    state.sessionInterrupted = false;
    state.lastTasksByDuelId = {};
    state.openedTaskKeys = [];
    state.pendingResult = null;
};

const clearActiveDuel = (state: DuelSessionState) => {
    state.activeDuelId = null;
    state.activeDuelUserId = null;
    state.phase = "idle";
    state.pendingStartedInCurrentRuntime = false;
    state.lastEventId = null;
    state.searchNickname = null;
    state.searchConfigurationId = null;
    state.searchInvitationType = null;
    state.searchTournamentId = null;
    state.duelCanceled = false;
    state.duelCanceledOpponentNickname = null;
    state.duelStatusChanged = false;
    state.sessionInterrupted = false;
    state.lastTasksByDuelId = {};
    state.openedTaskKeys = [];
};

const buildTaskSnapshot = (tasks?: Record<string, DuelTaskRef> | null) => {
    if (!tasks) return null;
    const snapshot: Record<string, string | null> = {};
    Object.entries(tasks).forEach(([key, value]) => {
        snapshot[key] = value?.id ?? null;
    });
    return snapshot;
};

const hasNewTaskOpened = (
    previousTasks: Record<string, string | null>,
    nextTasks: Record<string, DuelTaskRef>,
) =>
    Object.keys(nextTasks).some(
        (key) => (previousTasks[key] ?? null) === null && nextTasks[key]?.id !== null,
    );

const getOpenedTaskKeys = (
    previousTasks: Record<string, string | null>,
    nextTasks: Record<string, DuelTaskRef>,
) =>
    Object.keys(nextTasks)
        .filter((key) => (previousTasks[key] ?? null) === null && nextTasks[key]?.id !== null)
        .sort((a, b) => a.localeCompare(b));

const duelSessionSlice = createSlice({
    name: "duelSession",
    initialState,
    reducers: {
        setPhase: (state, action: PayloadAction<DuelSessionPhase>) => {
            if (action.payload === "searching" && state.activeDuelId !== null) {
                return;
            }
            state.phase = action.payload;
            state.pendingStartedInCurrentRuntime = action.payload === "searching";
            if (action.payload === "idle") {
                state.activeDuelId = null;
                state.activeDuelUserId = null;
                state.searchNickname = null;
                state.searchConfigurationId = null;
                state.searchInvitationType = null;
                state.searchTournamentId = null;
                state.lastTasksByDuelId = {};
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
        setDuelStatusChanged: (state, action: PayloadAction<boolean>) => {
            state.duelStatusChanged = action.payload;
        },
        setOpenedTaskKeys: (state, action: PayloadAction<string[]>) => {
            state.openedTaskKeys = action.payload;
        },
        setSessionInterrupted: (state, action: PayloadAction<boolean>) => {
            state.sessionInterrupted = action.payload;
        },
        setActiveDuel: (
            state,
            action: PayloadAction<{ duelId: number; userId: number } | null>,
        ) => {
            const duelId = action.payload?.duelId ?? null;
            if (
                action.payload &&
                state.pendingResult?.duelId === action.payload.duelId &&
                state.pendingResult.userId === action.payload.userId
            ) {
                return;
            }
            if (state.activeDuelId !== duelId) {
                state.lastTasksByDuelId = {};
                state.openedTaskKeys = [];
            }
            state.activeDuelId = duelId;
            state.activeDuelUserId = action.payload?.userId ?? null;
            if (duelId !== null) {
                state.pendingStartedInCurrentRuntime = false;
                if (state.phase === "searching" || state.phase === "idle") {
                    state.phase = "active";
                }
                state.searchNickname = null;
                state.searchConfigurationId = null;
                state.searchInvitationType = null;
                state.searchTournamentId = null;
                state.duelStatusChanged = false;
                state.openedTaskKeys = [];
                state.pendingResult = null;
            } else {
                state.lastEventId = null;
                state.duelStatusChanged = false;
                state.openedTaskKeys = [];
            }
        },
        finishActiveDuel: (state, action: PayloadAction<{ duelId: number; userId: number }>) => {
            const isActiveDuel =
                state.activeDuelId === action.payload.duelId &&
                (state.activeDuelUserId === action.payload.userId ||
                    state.activeDuelUserId === null);
            const isRestoredPendingResult =
                state.pendingResult?.duelId === action.payload.duelId &&
                state.pendingResult.userId === action.payload.userId;

            if (!isActiveDuel && !isRestoredPendingResult) return;

            clearActiveDuel(state);
            state.pendingResult = action.payload;
        },
        acknowledgeDuelResult: (
            state,
            action: PayloadAction<{ duelId: number; userId: number }>,
        ) => {
            if (
                state.pendingResult?.duelId === action.payload.duelId &&
                state.pendingResult.userId === action.payload.userId
            ) {
                state.pendingResult = null;
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
        setSearchInvitationType: (state, action: PayloadAction<PendingDuelType | null>) => {
            state.searchInvitationType = action.payload;
        },
        setSearchTournamentId: (state, action: PayloadAction<number | null>) => {
            state.searchTournamentId = action.payload;
        },
        resetDuelSession: (state) => {
            clearDuelSession(state);
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            duelApiSlice.endpoints.getActiveDuel.matchRejected,
            (state, { payload }) => {
                if (!isNotFoundError(payload)) return;

                if (
                    state.activeDuelId === null &&
                    shouldClearSessionAfterActiveDuelNotFound(state)
                ) {
                    clearDuelSession(state);
                }
            },
        );
        builder.addMatcher(duelApiSlice.endpoints.getDuel.matchFulfilled, (state, { payload }) => {
            const duelId = payload.id;
            const resultUserId = state.activeDuelUserId;
            const isCurrentActiveDuelFinished =
                payload.status === "Finished" &&
                state.activeDuelId === duelId &&
                resultUserId !== null &&
                (payload.participants ?? []).some((participant) => participant.id === resultUserId);
            const hasPreviousSnapshot = Object.prototype.hasOwnProperty.call(
                state.lastTasksByDuelId,
                duelId,
            );
            const previousTasks = hasPreviousSnapshot ? state.lastTasksByDuelId[duelId] : undefined;
            const nextTasks = payload.tasks ?? null;
            const shouldAffectActive = !state.activeDuelId || state.activeDuelId === duelId;

            if (shouldAffectActive && previousTasks && nextTasks) {
                if (hasNewTaskOpened(previousTasks, nextTasks)) {
                    state.openedTaskKeys = getOpenedTaskKeys(previousTasks, nextTasks);
                    state.duelStatusChanged = true;
                }
            }

            state.lastTasksByDuelId[duelId] = buildTaskSnapshot(nextTasks);

            if (isCurrentActiveDuelFinished) {
                clearActiveDuel(state);
                state.pendingResult = { duelId, userId: resultUserId };
            }
        });
    },
});

export const {
    setPhase,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setDuelStatusChanged,
    setOpenedTaskKeys,
    setActiveDuel,
    finishActiveDuel,
    acknowledgeDuelResult,
    setLastEventId,
    setSearchNickname,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchTournamentId,
    setSessionInterrupted,
    resetDuelSession,
} = duelSessionSlice.actions;
export default duelSessionSlice.reducer;
