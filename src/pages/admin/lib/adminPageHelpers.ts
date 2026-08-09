import type { PendingDuel, PendingDuelType } from "entities/duel";
import type { SubmissionItem } from "entities/submission";
import type { UserData } from "entities/user";
import { formatDuration } from "shared/lib/timeHelpers";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export const formatAdminDateTime = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return dateTimeFormatter.format(date);
};

export const formatAdminWaitTime = (startedAt: string, now: number) => {
    const startedAtMs = new Date(startedAt).getTime();
    if (Number.isNaN(startedAtMs)) return "—";

    return formatDuration(now - startedAtMs);
};

export const getInactiveUsers = (users: UserData[], activeUsers: UserData[]) => {
    const activeUserIds = new Set(activeUsers.map((user) => user.id));
    return users.filter((user) => !activeUserIds.has(user.id));
};

export const getCompletedSubmissions = (submissions: SubmissionItem[]) =>
    submissions.filter((submission) => submission.status === "Done");

export const getPendingDuelsByType = (duels: PendingDuel[], type: PendingDuelType) =>
    duels.filter((duel) => duel.type === type);
