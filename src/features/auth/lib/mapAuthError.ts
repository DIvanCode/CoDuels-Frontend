import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { StructError } from "superstruct";

export interface StatusPayload {
    title: string;
    description?: string;
}

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
    typeof error === "object" && error !== null && "status" in error;

export const mapValidationError = (error: StructError): StatusPayload => {
    const rawMessage = error.message;

    if (rawMessage.includes("Passwords do not match")) {
        return {
            title: "Пароли не совпадают",
            description: "Убедитесь, что оба поля *Пароль* заполнены одинаково.",
        };
    }

    if (rawMessage.includes("Expected a string with a length between 2 and 30")) {
        return {
            title: "Некорректный никнейм",
            description: "Допустимая длина — от 2 до 30 символов.",
        };
    }

    if (rawMessage.includes("Expected a string with a length between 6 and 30")) {
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
