import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import { duelApiSlice, type DuelTaskRef } from "entities/duel";
import type { PendingDuelType } from "entities/duel-invitation/model/types";

import type {
    DuelSearchContext,
    DuelSessionEventMetadata,
    DuelSessionPhase,
    DuelSessionState,
} from "./types";

const MAX_RECENT_EVENT_IDS = 32;

export const DUEL_SESSION_TRANSITIONS: Readonly<
    Record<DuelSessionPhase, readonly DuelSessionPhase[]>
> = {
    idle: ["configuring", "searching", "active", "interrupted"],
    configuring: ["idle", "searching", "active", "interrupted"],
    searching: ["configuring", "idle", "active", "interrupted"],
    active: ["finished", "interrupted"],
    finished: ["idle", "active", "interrupted"],
    interrupted: ["configuring", "idle", "active", "finished"],
};

export const initialDuelSessionState: DuelSessionState = {
    activeDuelId: null,
    phase: "idle",
    generation: null,
    pendingOperation: null,
    interruptedPhase: null,
    lastEventId: null,
    lastServerRevision: null,
    recentEventIds: [],
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
};

const clearSearchContext = (state: DuelSessionState) => {
    state.searchNickname = null;
    state.searchConfigurationId = null;
    state.searchInvitationType = null;
    state.searchTournamentId = null;
};

const resetToIdle = (state: DuelSessionState) => {
    state.activeDuelId = null;
    state.phase = "idle";
    state.pendingOperation = null;
    state.interruptedPhase = null;
    state.sessionInterrupted = false;
    state.duelStatusChanged = false;
    state.lastTasksByDuelId = {};
    state.openedTaskKeys = [];
    clearSearchContext(state);
};

const canApplyEvent = (state: DuelSessionState, metadata: DuelSessionEventMetadata) => {
    if (metadata.generation && metadata.generation !== state.generation) {
        return false;
    }

    if (
        metadata.revision != null &&
        state.lastServerRevision != null &&
        metadata.revision <= state.lastServerRevision
    ) {
        return false;
    }

    return !metadata.eventId || !state.recentEventIds.includes(metadata.eventId);
};

const recordEvent = (state: DuelSessionState, metadata: DuelSessionEventMetadata) => {
    if (metadata.revision != null) {
        state.lastServerRevision = metadata.revision;
    }

    if (!metadata.eventId) return;

    state.lastEventId = metadata.eventId;
    state.recentEventIds.push(metadata.eventId);
    if (state.recentEventIds.length > MAX_RECENT_EVENT_IDS) {
        state.recentEventIds.splice(0, state.recentEventIds.length - MAX_RECENT_EVENT_IDS);
    }
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
    initialState: initialDuelSessionState,
    reducers: {
        beginDuelConfiguration: {
            reducer: (state, action: PayloadAction<{ generation: string }>) => {
                if (state.phase !== "idle" && state.phase !== "configuring") return;

                state.generation = action.payload.generation;
                state.phase = "configuring";
                state.pendingOperation = null;
                state.duelCanceled = false;
                state.duelCanceledOpponentNickname = null;
            },
            prepare: () => ({ payload: { generation: nanoid() } }),
        },
        finishDuelConfiguration: (state) => {
            if (state.phase !== "configuring" || state.pendingOperation) return;
            resetToIdle(state);
        },
        beginDuelSearch: {
            reducer: (state, action: PayloadAction<DuelSearchContext & { generation: string }>) => {
                const { generation, nickname, configurationId, invitationType, tournamentId } =
                    action.payload;

                state.generation = generation;
                state.phase = "searching";
                state.pendingOperation = "start";
                state.interruptedPhase = null;
                state.activeDuelId = null;
                state.searchNickname = nickname;
                state.searchConfigurationId = configurationId;
                state.searchInvitationType = invitationType;
                state.searchTournamentId = tournamentId;
                state.duelCanceled = false;
                state.duelCanceledOpponentNickname = null;
                state.duelStatusChanged = false;
                state.sessionInterrupted = false;
                state.lastTasksByDuelId = {};
                state.openedTaskKeys = [];
            },
            prepare: (context: DuelSearchContext) => ({
                payload: { ...context, generation: nanoid() },
            }),
        },
        confirmDuelSearch: (state, action: PayloadAction<{ generation: string }>) => {
            if (action.payload.generation !== state.generation) return;
            if (state.pendingOperation === "start") {
                state.pendingOperation = null;
            }
        },
        failDuelSearch: (state, action: PayloadAction<{ generation: string }>) => {
            if (action.payload.generation !== state.generation) return;
            if (state.phase === "active" || state.phase === "finished") return;
            resetToIdle(state);
        },
        beginDuelSearchCancellation: {
            reducer: (state, action: PayloadAction<{ generation: string }>) => {
                if (state.phase !== "searching") return;

                state.generation = action.payload.generation;
                state.phase = "configuring";
                state.pendingOperation = "cancel";
            },
            prepare: () => ({ payload: { generation: nanoid() } }),
        },
        confirmDuelSearchCancellation: (state, action: PayloadAction<{ generation: string }>) => {
            if (action.payload.generation !== state.generation) return;
            if (state.phase === "active" || state.phase === "finished") return;
            resetToIdle(state);
        },
        failDuelSearchCancellation: (state, action: PayloadAction<{ generation: string }>) => {
            if (action.payload.generation !== state.generation) return;
            if (state.phase === "active" || state.phase === "finished") return;

            state.phase = "searching";
            state.pendingOperation = null;
        },
        beginDuelSessionRestore: {
            reducer: (state, action: PayloadAction<{ generation: string }>) => {
                state.generation = action.payload.generation;
                state.phase = "configuring";
                state.pendingOperation = "restore";
                state.interruptedPhase = null;
                state.sessionInterrupted = false;
            },
            prepare: () => ({ payload: { generation: nanoid() } }),
        },
        reconcileDuelSessionSucceeded: (
            state,
            action: PayloadAction<{ generation: string; duelId: number | null }>,
        ) => {
            if (action.payload.generation !== state.generation) return;

            if (action.payload.duelId == null) {
                resetToIdle(state);
                return;
            }

            if (state.activeDuelId !== action.payload.duelId) {
                state.lastTasksByDuelId = {};
                state.openedTaskKeys = [];
            }
            state.activeDuelId = action.payload.duelId;
            state.phase = "active";
            state.pendingOperation = null;
            state.interruptedPhase = null;
            state.sessionInterrupted = false;
            state.duelStatusChanged = false;
            clearSearchContext(state);
        },
        reconcileDuelSessionFailed: (state, action: PayloadAction<{ generation: string }>) => {
            if (action.payload.generation !== state.generation) return;

            state.interruptedPhase = state.activeDuelId ? "active" : "idle";
            state.phase = "interrupted";
            state.pendingOperation = null;
            state.sessionInterrupted = true;
        },
        confirmDuelStarted: (
            state,
            action: PayloadAction<
                { duelId: number; expectedGeneration: string | null } & DuelSessionEventMetadata
            >,
        ) => {
            const { duelId, expectedGeneration, ...metadata } = action.payload;
            if (expectedGeneration !== state.generation || !canApplyEvent(state, metadata)) return;
            if (state.phase === "finished" && state.activeDuelId === duelId) return;

            recordEvent(state, metadata);
            if (state.activeDuelId !== duelId) {
                state.lastTasksByDuelId = {};
                state.openedTaskKeys = [];
            }
            state.activeDuelId = duelId;
            state.phase = "active";
            state.pendingOperation = null;
            state.interruptedPhase = null;
            state.sessionInterrupted = false;
            state.duelStatusChanged = false;
            clearSearchContext(state);
        },
        markDuelFinished: (
            state,
            action: PayloadAction<
                { duelId: number; expectedGeneration: string | null } & DuelSessionEventMetadata
            >,
        ) => {
            const { duelId, expectedGeneration, ...metadata } = action.payload;
            if (expectedGeneration !== state.generation || !canApplyEvent(state, metadata)) return;
            if (state.activeDuelId !== duelId) return;
            if (state.phase !== "active") return;

            recordEvent(state, metadata);
            state.phase = "finished";
            state.pendingOperation = null;
            state.interruptedPhase = null;
            state.sessionInterrupted = false;
        },
        completeFinishedDuel: (
            state,
            action: PayloadAction<{ duelId: number; generation: string | null }>,
        ) => {
            if (action.payload.generation !== state.generation) return;
            if (state.phase !== "finished" || state.activeDuelId !== action.payload.duelId) return;
            resetToIdle(state);
        },
        applyDuelSearchCanceled: (
            state,
            action: PayloadAction<{ expectedGeneration: string | null } & DuelSessionEventMetadata>,
        ) => {
            const { expectedGeneration, ...metadata } = action.payload;
            if (expectedGeneration !== state.generation || !canApplyEvent(state, metadata)) return;
            if (
                state.phase !== "searching" &&
                !(state.phase === "configuring" && state.pendingOperation === "start")
            ) {
                return;
            }

            recordEvent(state, metadata);
            resetToIdle(state);
        },
        markDuelSessionInterrupted: (state) => {
            if (state.phase !== "interrupted") {
                state.interruptedPhase = state.phase;
                state.phase = "interrupted";
            }
            state.sessionInterrupted = true;
        },
        dismissDuelSessionInterrupted: (state) => {
            state.sessionInterrupted = false;
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
        resetDuelSession: {
            reducer: (state, action: PayloadAction<{ generation: string }>) => {
                const generation = action.payload.generation;
                Object.assign(state, initialDuelSessionState, { generation });
            },
            prepare: () => ({ payload: { generation: nanoid() } }),
        },
    },
    extraReducers: (builder) => {
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
    applyDuelSearchCanceled,
    beginDuelConfiguration,
    beginDuelSearch,
    beginDuelSearchCancellation,
    beginDuelSessionRestore,
    completeFinishedDuel,
    confirmDuelSearch,
    confirmDuelSearchCancellation,
    confirmDuelStarted,
    dismissDuelSessionInterrupted,
    failDuelSearch,
    failDuelSearchCancellation,
    finishDuelConfiguration,
    markDuelFinished,
    markDuelSessionInterrupted,
    reconcileDuelSessionFailed,
    reconcileDuelSessionSucceeded,
    resetDuelSession,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setDuelStatusChanged,
    setLastEventId,
    setOpenedTaskKeys,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
} = duelSessionSlice.actions;

export default duelSessionSlice.reducer;
