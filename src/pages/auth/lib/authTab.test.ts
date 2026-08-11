import { describe, expect, it } from "vitest";

import { resolveAuthTab } from "./authTab";

describe("resolveAuthTab", () => {
    it("opens registration after a direct registration link or reload", () => {
        expect(resolveAuthTab("?tab=register")).toBe("register");
        expect(resolveAuthTab(new URLSearchParams("tab=register"))).toBe("register");
    });

    it("keeps login as the default for the header link and unsupported values", () => {
        expect(resolveAuthTab("")).toBe("login");
        expect(resolveAuthTab("?tab=unknown")).toBe("login");
    });
});
