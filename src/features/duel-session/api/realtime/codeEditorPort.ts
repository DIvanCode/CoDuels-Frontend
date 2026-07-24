import type { LanguageValue } from "shared/config";

export const buildDuelTaskKey = (duelId: number, taskId: string) => `${duelId}:${taskId}`;

export const setOpponentCode = (payload: {
    taskKey: string;
    code: string;
    language: LanguageValue;
}) => ({
    type: "codeEditor/setOpponentCode" as const,
    payload,
});
