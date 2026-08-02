import { describe, expect, it, vi } from "vitest";

import reducer, {
    acknowledgeDuelResult,
    finishActiveDuel,
    resetDuelSession,
    setActiveDuel,
} from "./duelSessionSlice";

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getActiveDuel: { matchRejected: () => false },
            getDuel: { matchFulfilled: () => false },
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
});
