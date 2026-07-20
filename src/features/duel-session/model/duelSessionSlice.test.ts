import { afterEach, describe, expect, it, vi } from "vitest";

import duelSessionReducer, {
    applyDuelSearchCanceled,
    beginDuelSearch,
    beginDuelSearchCancellation,
    beginDuelSessionRestore,
    completeFinishedDuel,
    confirmDuelSearch,
    confirmDuelSearchCancellation,
    confirmDuelStarted,
    failDuelSearch,
    markDuelFinished,
    markDuelSessionInterrupted,
    reconcileDuelSessionSucceeded,
} from "./duelSessionSlice";
import type { DuelSearchContext, DuelSessionState } from "./types";

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getDuel: {
                matchFulfilled: () => false,
            },
        },
    },
}));

const rankedContext: DuelSearchContext = {
    nickname: null,
    configurationId: null,
    invitationType: "Ranked",
    tournamentId: null,
};

const reduce = (
    state: DuelSessionState | undefined,
    action: Parameters<typeof duelSessionReducer>[1],
) => duelSessionReducer(state, action);

const beginSearch = (state: DuelSessionState | undefined, context = rankedContext) => {
    const action = beginDuelSearch(context);
    return { action, state: reduce(state, action) };
};

describe("duel session state machine", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([
        ["Ranked", rankedContext],
        [
            "Friendly",
            {
                nickname: "friend",
                configurationId: 12,
                invitationType: "Friendly",
                tournamentId: null,
            } satisfies DuelSearchContext,
        ],
        [
            "Group",
            {
                nickname: "member",
                configurationId: 13,
                invitationType: "Group",
                tournamentId: null,
            } satisfies DuelSearchContext,
        ],
        [
            "Tournament",
            {
                nickname: "rival",
                configurationId: 14,
                invitationType: "Tournament",
                tournamentId: 15,
            } satisfies DuelSearchContext,
        ],
    ])("uses the same monotonic transitions for %s sessions", (_name, context) => {
        const started = beginSearch(undefined, context);
        const generation = started.action.payload.generation;
        let state = reduce(
            started.state,
            confirmDuelStarted({ duelId: 101, expectedGeneration: generation, eventId: "start" }),
        );

        state = reduce(state, confirmDuelSearch({ generation }));

        expect(state.phase).toBe("active");
        expect(state.activeDuelId).toBe(101);
        expect(state.pendingOperation).toBeNull();
    });

    it("is order-independent when the HTTP success and DuelStarted race", () => {
        vi.useFakeTimers();
        const started = beginSearch(undefined);
        const generation = started.action.payload.generation;
        let state = started.state;

        setTimeout(() => {
            state = reduce(state, confirmDuelSearch({ generation }));
        }, 20);
        setTimeout(() => {
            state = reduce(
                state,
                confirmDuelStarted({
                    duelId: 42,
                    expectedGeneration: generation,
                    eventId: "event-42",
                    revision: 42,
                }),
            );
        }, 10);

        vi.advanceTimersByTime(10);
        expect(state.phase).toBe("active");
        vi.advanceTimersByTime(10);
        expect(state.phase).toBe("active");
        expect(state.activeDuelId).toBe(42);
    });

    it("does not let a late HTTP failure erase an active duel", () => {
        const started = beginSearch(undefined);
        const generation = started.action.payload.generation;
        let state = reduce(
            started.state,
            confirmDuelStarted({ duelId: 7, expectedGeneration: generation }),
        );

        state = reduce(state, failDuelSearch({ generation }));

        expect(state.phase).toBe("active");
        expect(state.activeDuelId).toBe(7);
    });

    it("ignores responses and events from an older generation", () => {
        const first = beginSearch(undefined);
        const second = beginSearch(first.state, {
            ...rankedContext,
            nickname: "new-opponent",
            invitationType: "Friendly",
        });
        const oldGeneration = first.action.payload.generation;
        let state = reduce(first.state, second.action);

        state = reduce(
            state,
            confirmDuelStarted({ duelId: 1, expectedGeneration: oldGeneration, eventId: "old" }),
        );
        state = reduce(state, confirmDuelSearch({ generation: oldGeneration }));
        state = reduce(
            state,
            applyDuelSearchCanceled({
                expectedGeneration: oldGeneration,
                eventId: "old-cancel",
            }),
        );

        expect(state.phase).toBe("searching");
        expect(state.searchNickname).toBe("new-opponent");
        expect(state.generation).toBe(second.action.payload.generation);
    });

    it("keeps an active duel when cancel loses the cancel-vs-start race", () => {
        const started = beginSearch(undefined);
        const cancelAction = beginDuelSearchCancellation();
        let state = reduce(started.state, cancelAction);
        const cancelGeneration = cancelAction.payload.generation;

        state = reduce(
            state,
            confirmDuelStarted({ duelId: 9, expectedGeneration: cancelGeneration }),
        );
        state = reduce(state, confirmDuelSearchCancellation({ generation: cancelGeneration }));

        expect(state.phase).toBe("active");
        expect(state.activeDuelId).toBe(9);
    });

    it("ignores duplicate and out-of-order realtime events", () => {
        const started = beginSearch(undefined);
        const generation = started.action.payload.generation;
        let state = reduce(
            started.state,
            confirmDuelStarted({
                duelId: 25,
                expectedGeneration: generation,
                eventId: "event-25",
                revision: 25,
            }),
        );

        state = reduce(
            state,
            markDuelFinished({
                duelId: 25,
                expectedGeneration: generation,
                eventId: "event-25",
                revision: 25,
            }),
        );
        state = reduce(
            state,
            markDuelFinished({
                duelId: 25,
                expectedGeneration: generation,
                eventId: "event-24",
                revision: 24,
            }),
        );

        expect(state.phase).toBe("active");
    });

    it("retains the finished duel until its result data has loaded", () => {
        const started = beginSearch(undefined);
        const generation = started.action.payload.generation;
        let state = reduce(
            started.state,
            confirmDuelStarted({ duelId: 31, expectedGeneration: generation }),
        );
        state = reduce(
            state,
            markDuelFinished({ duelId: 31, expectedGeneration: generation, eventId: "finish" }),
        );
        state = reduce(
            state,
            confirmDuelStarted({
                duelId: 31,
                expectedGeneration: generation,
                eventId: "late-start",
            }),
        );

        expect(state.phase).toBe("finished");
        expect(state.activeDuelId).toBe(31);

        state = reduce(state, completeFinishedDuel({ duelId: 31, generation }));
        expect(state.phase).toBe("idle");
        expect(state.activeDuelId).toBeNull();
    });

    it.each([
        ["idle", null, null],
        ["searching", null, null],
        ["active", null, null],
        ["idle", 18, 18],
        ["searching", 18, 18],
        ["active", 18, 18],
    ] as const)(
        "normalizes persisted %s/%s from the server duel id",
        (persistedPhase, persistedDuelId, serverDuelId) => {
            const persisted = {
                ...reduce(undefined, { type: "test/init" }),
                phase: persistedPhase,
                activeDuelId: persistedDuelId,
            } satisfies DuelSessionState;
            const restoreAction = beginDuelSessionRestore();
            let state = reduce(persisted, restoreAction);

            state = reduce(
                state,
                reconcileDuelSessionSucceeded({
                    generation: restoreAction.payload.generation,
                    duelId: serverDuelId,
                }),
            );

            expect(state.phase).toBe(serverDuelId ? "active" : "idle");
            expect(state.activeDuelId).toBe(serverDuelId);
        },
    );

    it("keeps the interrupted phase explicit until server reconciliation", () => {
        const started = beginSearch(undefined);
        let state = reduce(started.state, markDuelSessionInterrupted());

        expect(state.phase).toBe("interrupted");
        expect(state.interruptedPhase).toBe("searching");

        const restoreAction = beginDuelSessionRestore();
        state = reduce(state, restoreAction);
        state = reduce(
            state,
            reconcileDuelSessionSucceeded({
                generation: restoreAction.payload.generation,
                duelId: 88,
            }),
        );

        expect(state.phase).toBe("active");
        expect(state.activeDuelId).toBe(88);
    });
});
