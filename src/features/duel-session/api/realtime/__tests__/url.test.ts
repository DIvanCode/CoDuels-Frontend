import { describe, expect, it } from "vitest";

import { buildUserConnectUrl } from "../url";

describe("buildUserConnectUrl", () => {
    it("uses wss for an HTTPS API base", () => {
        expect(
            buildUserConnectUrl("https://duels.example/api", "https://duels.example", "a b"),
        ).toBe("wss://duels.example/api/users/connect?ticket=a+b");
    });

    it("uses ws for a local HTTP API base", () => {
        expect(buildUserConnectUrl("/api", "http://localhost:5173", "ticket")).toBe(
            "ws://localhost:5173/api/users/connect?ticket=ticket",
        );
    });
});
