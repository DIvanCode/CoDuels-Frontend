import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveAdminViewState } from "./adminViewState";

const stored = new Map<string, string>();
let navigationType = "reload";

beforeEach(() => {
    stored.clear();
    navigationType = "reload";
    vi.stubGlobal("window", {
        sessionStorage: {
            getItem: (key: string) => stored.get(key) ?? null,
            setItem: (key: string, value: string) => stored.set(key, value),
        },
        performance: { getEntriesByType: () => [{ type: navigationType }] },
    });
});

afterEach(() => vi.unstubAllGlobals());

describe("admin view state", () => {
    it("restores the same user's scroll and sections after a module reload", async () => {
        const state = { scrollTop: 1759, openSections: { users: false, duels: true } };
        saveAdminViewState(1, "entry-a", state);

        vi.resetModules();
        const { readAdminViewState } = await import("./adminViewState");
        expect(readAdminViewState(1, "entry-a")).toEqual(state);
        expect(readAdminViewState(2, "entry-a")).toEqual({ scrollTop: 0, openSections: {} });
        expect(readAdminViewState(1, "entry-b")).toEqual({ scrollTop: 0, openSections: {} });
    });

    it("starts a fresh document at the top when its history key is default", async () => {
        saveAdminViewState(1, "default", { scrollTop: 500, openSections: { users: false } });
        navigationType = "navigate";

        vi.resetModules();
        const { readAdminViewState } = await import("./adminViewState");
        expect(readAdminViewState(1, "default")).toEqual({ scrollTop: 0, openSections: {} });
    });

    it("ignores invalid saved positions", async () => {
        stored.set("admin-view:v1:1:entry-c", JSON.stringify({ version: 1, scrollTop: -1 }));

        vi.resetModules();
        const { readAdminViewState } = await import("./adminViewState");
        expect(readAdminViewState(1, "entry-c")).toEqual({ scrollTop: 0, openSections: {} });
    });
});
