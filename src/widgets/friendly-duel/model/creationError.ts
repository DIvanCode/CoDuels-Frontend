import type { FriendlyDuelError } from "./types";

const getErrorStatus = (error: unknown) => {
    if (!error || typeof error !== "object" || !("status" in error)) return null;

    return (error as { status?: number }).status ?? null;
};

export const getFriendlyDuelCreationError = (error: unknown): FriendlyDuelError => {
    const status = getErrorStatus(error);

    if (status === 404) {
        return {
            title: "Не получилось отправить вызов на дуэль",
            description: "Не найден соперник с таким никнеймом",
        };
    }

    if (status === 409) {
        return {
            title: "Не получилось отправить вызов на дуэль",
            description: "Возможно, у вас уже есть вызов на дуэль от этого пользователя.",
        };
    }

    return {
        title: "Не получилось отправить вызов на дуэль",
        description: "Проверьте соединение и попробуйте ещё раз.",
    };
};
