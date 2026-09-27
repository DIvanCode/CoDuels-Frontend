import { describe, expect, it } from "vitest";
import { validate } from "superstruct";

import { loginStruct, registrationStruct } from "../model/authStruct";
import { mapAuthApiError, mapValidationError } from "./mapAuthError";

const registration = (nickname: string) => ({
    nickname,
    password: "password123",
    confirmPassword: "password123",
});

describe("registration nickname", () => {
    it.each(["AZaz09_", "user_1"])("accepts %s", (nickname) => {
        const [error] = validate(registration(nickname), registrationStruct);
        expect(error).toBeUndefined();
    });

    it.each(["bad-name", "bad name", "имя", "bad.name", "user\n"])(
        "explains why %s cannot be registered",
        (nickname) => {
            const [error] = validate(registration(nickname), registrationStruct);
            expect(error).toBeDefined();
            if (!error) throw new Error("Expected invalid nickname");
            expect(mapValidationError(error).description).toContain("латинские буквы");
        },
    );

    it("explains the backend nickname error", () => {
        const status = mapAuthApiError({
            status: 400,
            data: {
                errors: {
                    Nickname: ["Nickname may contain only Latin letters, digits, and underscores."],
                },
            },
        });
        expect(status.description).toContain("латинские буквы");
    });

    it("still permits existing nicknames when logging in", () => {
        const [error] = validate({ nickname: "old-name", password: "password123" }, loginStruct);
        expect(error).toBeUndefined();
    });
});
