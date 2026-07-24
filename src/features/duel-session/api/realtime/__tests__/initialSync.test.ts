import { describe, expect, it } from "vitest";

import { hasStaleActiveSession } from "../initialSyncState";

const createState = (phase: "searching" | "active", activeDuelId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: { phase, activeDuelId },
    }) as RootState;

describe("initial sync state", () => {
    it("preserves a pending search when no active duel exists yet", () => {
        expect(hasStaleActiveSession(createState("searching", null))).toBe(false);
    });

    it("identifies stale active state after an active-duel 404", () => {
        expect(hasStaleActiveSession(createState("active", 42))).toBe(true);
    });
});
