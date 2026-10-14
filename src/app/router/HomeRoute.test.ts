import { describe, expect, it } from "vitest";

import { resolveHomeRouteView } from "./homeRouteState";

const idleState = {
    isError: false,
    isLoading: false,
    isSuccess: false,
};

describe("resolveHomeRouteView", () => {
    it("shows the landing page to a guest", () => {
        expect(resolveHomeRouteView(null, idleState, false)).toBe("landing");
    });

    it("waits for getMe when a saved token exists", () => {
        expect(
            resolveHomeRouteView(
                "saved-token",
                {
                    ...idleState,
                    isLoading: true,
                },
                false,
            ),
        ).toBe("loading");
    });

    it("does not redirect an admin until getMe succeeds", () => {
        expect(resolveHomeRouteView("admin-token", idleState, true)).toBe("loading");
    });

    it("keeps waiting instead of exposing either home on a non-auth error", () => {
        expect(
            resolveHomeRouteView(
                "saved-token",
                {
                    ...idleState,
                    isError: true,
                    error: { status: "FETCH_ERROR" },
                },
                true,
            ),
        ).toBe("loading");
    });

    it("shows the existing home only after getMe succeeds", () => {
        expect(
            resolveHomeRouteView(
                "valid-token",
                {
                    ...idleState,
                    isSuccess: true,
                },
                false,
            ),
        ).toBe("home");
    });

    it("redirects an admin after getMe succeeds", () => {
        expect(
            resolveHomeRouteView(
                "admin-token",
                {
                    ...idleState,
                    isSuccess: true,
                },
                true,
            ),
        ).toBe("admin");
    });

    it("falls back to the landing page when the saved token is unauthorized", () => {
        expect(
            resolveHomeRouteView(
                "expired-token",
                {
                    ...idleState,
                    isError: true,
                    error: { status: 401 },
                },
                true,
            ),
        ).toBe("landing");
    });
});
