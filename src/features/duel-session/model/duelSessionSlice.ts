import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice, type DuelTaskRef } from "entities/duel";
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
    duelStatusChanged: false,
    sessionInterrupted: false,
    lastTasksByDuelId: {},
    openedTaskKeys: [],
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
            state.phase = action.payload;
            if (action.payload === "idle") {
                state.activeDuelId = null;
                state.searchNickname = null;
                state.searchConfigurationId = null;
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
        setActiveDuelId: (state, action: PayloadAction<number | null>) => {
            if (state.activeDuelId !== action.payload) {
                state.lastTasksByDuelId = {};
                state.openedTaskKeys = [];
            }
            state.activeDuelId = action.payload;
            if (action.payload) {
                if (state.phase === "searching" || state.phase === "idle") {
                    state.phase = "active";
                }
                state.searchNickname = null;
                state.searchConfigurationId = null;
                state.duelStatusChanged = false;
                state.openedTaskKeys = [];
            } else {
                state.lastEventId = null;
                state.duelStatusChanged = false;
                state.openedTaskKeys = [];
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
            state.duelStatusChanged = false;
            state.sessionInterrupted = false;
            state.lastTasksByDuelId = {};
            state.openedTaskKeys = [];
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
                    state.duelStatusChanged = false;
                    state.openedTaskKeys = [];
                }
            },
        );
        builder.addMatcher(duelApiSlice.endpoints.getDuel.matchFulfilled, (state, { payload }) => {
            const duelId = payload.id;
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
        });
    },
});

export const {
    setPhase,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setDuelStatusChanged,
    setOpenedTaskKeys,
    setActiveDuelId,
    setLastEventId,
    setSearchNickname,
    setSearchConfigurationId,
    setSessionInterrupted,
    resetDuelSession,
} = duelSessionSlice.actions;
export default duelSessionSlice.reducer;
