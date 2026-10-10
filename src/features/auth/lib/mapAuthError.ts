import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { StructError } from "superstruct";

export interface StatusPayload {
    title: string;
    description?: string;
}

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
    typeof error === "object" && error !== null && "status" in error;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const nicknameCharactersError: StatusPayload = {
    title: "Некорректный никнейм",
    description:
        "Никнейм может содержать только латинские буквы, цифры, дефис и знак подчёркивания.",
};

const passwordTooShortError: StatusPayload = {
    title: "Слишком короткий пароль",
    description: "Пароль должен содержать не меньше 8 символов.",
};

const getValidationMessages = (errors: Record<string, unknown>, field: string): string[] => {
    const messages = errors[field];
    return Array.isArray(messages)
        ? messages.filter((message): message is string => typeof message === "string")
        : [];
};

export const mapValidationError = (error: StructError): StatusPayload => {
    const rawMessage = error.message;

    if (error.refinement === "RegistrationNickname") {
        return nicknameCharactersError;
    }

    if (rawMessage.includes("Passwords do not match")) {
        return {
            title: "Пароли не совпадают",
            description: "Убедитесь, что оба поля *Пароль* заполнены одинаково.",
        };
    }

    if (rawMessage.includes("Expected a string with a length between `2` and `30`")) {
        return {
            title: "Некорректный никнейм",
            description: "Допустимая длина — от 2 до 30 символов.",
        };
    }

    if (rawMessage.includes("Expected a string with a length between `8` and `30`")) {
        if (typeof error.value === "string" && error.value.length < 8) {
            return passwordTooShortError;
        }
        return {
            title: "Некорректный пароль",
            description: "Пароль должен содержать не больше 30 символов.",
        };
    }

    if (rawMessage.includes("Expected a string with a length between `6` and `30`")) {
        return {
            title: "Некорректный пароль",
            description: "Пароль должен быть длиной от 6 до 30 символов.",
        };
    }

    return {
        title: "Проверьте введённые данные",
        description: "Исправьте ошибки в форме и попробуйте снова.",
    };
};

export const mapAuthApiError = (
    error: FetchBaseQueryError | SerializedError | unknown,
): StatusPayload => {
    if (isFetchBaseQueryError(error)) {
        const status = error.status;
        if (status === 401) {
            return {
                title: "Неверный никнейм или пароль",
                description: "Проверьте введённые данные и попробуйте ещё раз.",
            };
        }
        if (status === 404) {
            return {
                title: "Пользователь не найден",
                description: "Убедитесь, что вы зарегистрированы, или создайте новый аккаунт.",
            };
        }

        if (typeof status === "number" && status >= 500) {
            return {
                title: "Сервис временно недоступен",
                description: "Попробуйте выполнить запрос чуть позже.",
            };
        }

        if ("data" in error && typeof error.data === "object" && error.data !== null) {
            const maybeMessage = (error.data as { detail?: string; message?: string }).detail;
            if (maybeMessage) {
                return { title: maybeMessage };
            }
        }
    }

    return {
        title: "Не удалось выполнить запрос",
        description: "Попробуйте еще раз.",
    };
};

export const mapRegistrationApiError = (error: unknown): StatusPayload => {
    if (!isFetchBaseQueryError(error)) {
        return mapAuthApiError(error);
    }

    if (error.status === 409) {
        return {
            title: "Никнейм уже занят",
            description: "Пользователь с таким никнеймом уже существует. Выберите другой никнейм.",
        };
    }

    if (error.status === 400 && "data" in error && isRecord(error.data)) {
        const validationErrors = error.data.errors;
        if (isRecord(validationErrors)) {
            const nicknameMessages = getValidationMessages(validationErrors, "Nickname");
            const passwordMessages = getValidationMessages(validationErrors, "Password");

            const nicknameDescription = nicknameMessages.length
                ? nicknameMessages.some((message) =>
                      message.toLowerCase().includes("invalid nickname"),
                  )
                    ? nicknameCharactersError.description
                    : "Проверьте никнейм и попробуйте ещё раз."
                : null;
            const passwordDescription = passwordMessages.length
                ? passwordMessages.some((message) =>
                      message.toLowerCase().includes("password must be at least 8 characters"),
                  )
                    ? passwordTooShortError.description
                    : "Проверьте пароль и попробуйте ещё раз."
                : null;

            if (nicknameDescription && passwordDescription) {
                return {
                    title: "Проверьте никнейм и пароль",
                    description: `${nicknameDescription} ${passwordDescription}`,
                };
            }
            if (nicknameDescription) {
                return { title: "Некорректный никнейм", description: nicknameDescription };
            }
            if (passwordDescription) {
                return { title: "Некорректный пароль", description: passwordDescription };
            }
        }
    }

    if (error.status === 400) {
        return {
            title: "Проверьте данные регистрации",
            description: "Исправьте ошибки в форме и попробуйте ещё раз.",
        };
    }

    return mapAuthApiError(error);
};
