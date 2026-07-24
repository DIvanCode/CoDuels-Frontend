import { describe, expect, it } from "vitest";

import { hasStaleActiveSession } from "../initialSyncState";

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
});
