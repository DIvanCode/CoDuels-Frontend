import { describe, expect, it } from "vitest";

import {
    doesDuelResultCandidateOwnSession,
    getDuelResultCandidateId,
    hasStaleActiveSession,
    isFinishedDuelResultForUser,
} from "../initialSyncState";

const createState = (
    phase: "searching" | "active",
    activeDuelId: number | null,
    pendingStartedInCurrentRuntime = false,
) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: { phase, activeDuelId, pendingStartedInCurrentRuntime },
    }) as RootState;

describe("initial sync state", () => {
    it("preserves a pending search started in the current runtime", () => {
        expect(hasStaleActiveSession(createState("searching", null, true))).toBe(false);
    });

    it("identifies a rehydrated pending search as stale after an active-duel 404", () => {
        expect(hasStaleActiveSession(createState("searching", null))).toBe(true);
    });

    it("identifies stale active state after an active-duel 404", () => {
        expect(hasStaleActiveSession(createState("active", 42))).toBe(true);
    });

    it("reconciles owned and ownerless legacy candidates for the current user", () => {
        const state = {
            auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
            duelSession: {
                phase: "active",
                activeDuelId: 42,
                activeDuelUserId: 7,
                pendingResult: null,
            },
        } as RootState;

        expect(getDuelResultCandidateId(state, 7)).toBe(42);
        expect(getDuelResultCandidateId(state, 8)).toBeNull();
        expect(
            getDuelResultCandidateId(
                {
                    ...state,
                    duelSession: {
                        ...state.duelSession,
                        activeDuelUserId: null,
                    },
                } as RootState,
                7,
            ),
        ).toBe(42);
    });

    it("fences an old result candidate after a newer duel takes ownership", () => {
        const state = {
            auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
            duelSession: {
                phase: "active",
                activeDuelId: 42,
                activeDuelUserId: null,
                pendingResult: null,
            },
        } as RootState;

        expect(doesDuelResultCandidateOwnSession(state, 42, 7)).toBe(true);
        expect(
            doesDuelResultCandidateOwnSession(
                {
                    ...state,
                    duelSession: {
                        ...state.duelSession,
                        activeDuelId: 43,
                        activeDuelUserId: 7,
                    },
                } as RootState,
                42,
                7,
            ),
        ).toBe(false);
    });

    it("restores an unacknowledged result candidate after refresh", () => {
        const state = {
            auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
            duelSession: {
                phase: "idle",
                activeDuelId: null,
                activeDuelUserId: null,
                pendingResult: { duelId: 42, userId: 7 },
            },
        } as RootState;

        expect(getDuelResultCandidateId(state, 7)).toBe(42);
    });

    it("accepts only a finished candidate containing the current user", () => {
        const duel = {
            id: 42,
            status: "Finished",
            participants: [{ id: 7 }, { id: 8 }],
        } as Parameters<typeof isFinishedDuelResultForUser>[0];

        expect(isFinishedDuelResultForUser(duel, 42, 7)).toBe(true);
        expect(isFinishedDuelResultForUser(duel, 41, 7)).toBe(false);
        expect(isFinishedDuelResultForUser(duel, 42, 9)).toBe(false);
        expect(isFinishedDuelResultForUser({ ...duel, status: "InProgress" }, 42, 7)).toBe(false);
    });
});
