import { describe, expect, it, vi } from "vitest";

import reducer, {
    DUEL_START_FENCE_DURATION_MS,
    acknowledgeDuelResult,
    finishActiveDuel,
    resetDuelSession,
    setActiveDuel,
    setPhase,
} from "./duelSessionSlice";

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getActiveDuel: { matchRejected: () => false },
            getDuel: {
                matchFulfilled: (action: { type?: string }) =>
                    action.type === "duel/getDuel/fulfilled",
            },
        },
    },
}));

describe("duel result notification state", () => {
    it("queues the active duel result once and ignores duplicate finish transitions after acknowledgement", () => {
        let state = reducer(undefined, { type: "test/init" });
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));
        state = reducer(state, finishActiveDuel({ duelId: 42, userId: 7 }));

        expect(state).toMatchObject({
            activeDuelId: null,
            activeDuelUserId: null,
            phase: "idle",
            pendingResult: { duelId: 42, userId: 7 },
        });

        state = reducer(state, finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(state.pendingResult).toEqual({ duelId: 42, userId: 7 });

        state = reducer(state, acknowledgeDuelResult({ duelId: 42, userId: 7 }));
        state = reducer(state, finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(state.pendingResult).toBeNull();
    });

    it("keeps a terminal result when a stale active response arrives afterward", () => {
        let state = reducer(undefined, { type: "test/init" });
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));
        state = reducer(state, finishActiveDuel({ duelId: 42, userId: 7 }));
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));

        expect(state).toMatchObject({
            activeDuelId: null,
            phase: "idle",
            pendingResult: { duelId: 42, userId: 7 },
        });
    });

    it("queues the current result when HTTP polling observes the active duel finished", () => {
        let state = reducer(undefined, { type: "test/init" });
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));
        state = reducer(state, {
            type: "duel/getDuel/fulfilled",
            payload: {
                id: 42,
                status: "Finished",
                participants: [{ id: 7 }, { id: 8 }],
                tasks: null,
            },
        });

        expect(state).toMatchObject({
            activeDuelId: null,
            activeDuelUserId: null,
            phase: "idle",
            pendingResult: { duelId: 42, userId: 7 },
        });
    });

    it("does not queue a result for an ordinary historical finished-duel query", () => {
        const state = reducer(undefined, {
            type: "duel/getDuel/fulfilled",
            payload: {
                id: 41,
                status: "Finished",
                participants: [{ id: 7 }, { id: 8 }],
                tasks: null,
            },
        });

        expect(state.pendingResult).toBeNull();
    });

    it("accepts a current terminal event while migrating legacy active state without an owner", () => {
        const state = {
            ...reducer(undefined, { type: "test/init" }),
            activeDuelId: 42,
            activeDuelUserId: null,
            phase: "active" as const,
        };

        expect(reducer(state, finishActiveDuel({ duelId: 42, userId: 7 })).pendingResult).toEqual({
            duelId: 42,
            userId: 7,
        });
    });

    it("does not queue a historical or another user's duel", () => {
        let state = reducer(undefined, { type: "test/init" });
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));

        expect(
            reducer(state, finishActiveDuel({ duelId: 41, userId: 7 })).pendingResult,
        ).toBeNull();
        expect(
            reducer(state, finishActiveDuel({ duelId: 42, userId: 8 })).pendingResult,
        ).toBeNull();
    });

    it("clears pending results on an account/session reset and when a new duel starts", () => {
        let state = reducer(undefined, { type: "test/init" });
        state = reducer(state, setActiveDuel({ duelId: 42, userId: 7 }));
        state = reducer(state, finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(reducer(state, resetDuelSession()).pendingResult).toBeNull();

        state = reducer(state, setActiveDuel({ duelId: 43, userId: 7 }));
        expect(state.pendingResult).toBeNull();
    });

    it("fences a late start after cancellation for a bounded interval", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-02T13:00:00Z"));
        let state = reducer(undefined, setPhase("searching"));
        state = reducer(state, setPhase("idle"));

        expect(state.duelStartFenceExpiresAt).toBe(Date.now() + DUEL_START_FENCE_DURATION_MS);

        state = reducer(state, setPhase("searching"));
        expect(state.duelStartFenceExpiresAt).toBeNull();
        vi.useRealTimers();
    });

    it("adds the same bounded fence when a server cancellation resets the session", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-02T13:00:00Z"));
        const state = reducer(undefined, resetDuelSession({ fenceDuelStart: true }));

        expect(state.duelStartFenceExpiresAt).toBe(Date.now() + DUEL_START_FENCE_DURATION_MS);
        vi.useRealTimers();
    });
});
