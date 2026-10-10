import { describe, expect, it } from "vitest";
import { validate } from "superstruct";

import { loginStruct, registrationStruct } from "../model/authStruct";
import { mapRegistrationApiError, mapValidationError } from "./mapAuthError";

const registration = (nickname: string) => ({
    nickname,
    password: "password123",
    confirmPassword: "password123",
});

describe("registration nickname", () => {
    it.each(["AZaz09_", "user_1", "user-1"])("accepts %s", (nickname) => {
        const [error] = validate(registration(nickname), registrationStruct);
        expect(error).toBeUndefined();
    });

    it.each(["bad name", "имя", "bad.name"])("explains why %s cannot be registered", (nickname) => {
        const [error] = validate(registration(nickname), registrationStruct);
        expect(error).toBeDefined();
        if (!error) throw new Error("Expected invalid nickname");
        expect(mapValidationError(error).description).toContain("латинские буквы");
    });

    it("explains the backend nickname error", () => {
        const status = mapRegistrationApiError({
            status: 400,
            data: {
                errors: {
                    Nickname: ["Invalid nickname."],
                },
            },
        });
        expect(status.description).toContain("дефис");
    });

    it("explains when the nickname already exists", () => {
        const status = mapRegistrationApiError({ status: 409, data: {} });
        expect(status.description).toContain("уже существует");
    });

    it("shows both nickname and password errors from one 400 response", () => {
        const status = mapRegistrationApiError({
            status: 400,
            data: {
                errors: {
                    Nickname: ["Invalid nickname."],
                    Password: ["Password must be at least 8 characters"],
                },
            },
        });
        expect(status.description).toContain("латинские буквы");
        expect(status.description).toContain("не меньше 8 символов");
        expect(status.description).not.toContain("Invalid nickname");
    });

    it("explains a password-only 400 response", () => {
        const status = mapRegistrationApiError({
            status: 400,
            data: { errors: { Password: ["Password must be at least 8 characters"] } },
        });
        expect(status.title).toBe("Некорректный пароль");
        expect(status.description).toContain("не меньше 8 символов");
    });

    it("does not claim an unknown nickname error is about characters", () => {
        const status = mapRegistrationApiError({
            status: 400,
            data: { errors: { Nickname: ["Another nickname error"] } },
        });
        expect(status.description).toContain("Проверьте никнейм");
        expect(status.description).not.toContain("латинские буквы");
    });

    it("requires at least eight password characters at registration", () => {
        const [error] = validate(
            { nickname: "user_1", password: "1234567", confirmPassword: "1234567" },
            registrationStruct,
        );
        expect(error).toBeDefined();
        if (!error) throw new Error("Expected invalid password");
        expect(mapValidationError(error).description).toContain("не меньше 8 символов");
    });

    it("still permits existing nicknames when logging in", () => {
        const [error] = validate({ nickname: "old-name", password: "password123" }, loginStruct);
        expect(error).toBeUndefined();
    });
});
