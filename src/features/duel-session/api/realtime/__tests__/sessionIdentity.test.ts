import { describe, expect, it } from "vitest";

import { selectRealtimeUserId } from "../sessionIdentity";

const createState = (userId: number | null, token: string | null) =>
    ({
        auth: {
            user: userId === null ? null : { id: userId },
            token,
        },
    }) as RootState;

describe("selectRealtimeUserId", () => {
    it("does not start a session for a user restored without a token", () => {
        expect(selectRealtimeUserId(createState(42, null))).toBeNull();
    });

    it("exposes the user after the token becomes available", () => {
        expect(selectRealtimeUserId(createState(42, "access-token"))).toBe(42);
    });
});
