import { describe, expect, it } from "vitest";

import { isAdminAccessToken } from "./isAdminAccessToken";

const accessToken = (payload: object) => {
    const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    return `header.${encodedPayload}.signature`;
};

describe("isAdminAccessToken", () => {
    it.each([true, "True", "true"])("accepts the admin claim %s", (claim) => {
        expect(isAdminAccessToken(accessToken({ is_admin: claim }))).toBe(true);
    });

    it.each([false, "False", undefined])("rejects the admin claim %s", (claim) => {
        expect(isAdminAccessToken(accessToken({ is_admin: claim }))).toBe(false);
    });

    it("rejects missing and malformed tokens", () => {
        expect(isAdminAccessToken(null)).toBe(false);
        expect(isAdminAccessToken("not-a-jwt")).toBe(false);
        expect(isAdminAccessToken("header.invalid-payload.signature")).toBe(false);
    });
});
