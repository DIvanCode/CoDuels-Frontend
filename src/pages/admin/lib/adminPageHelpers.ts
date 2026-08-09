import type { PendingDuel, PendingDuelType } from "entities/duel";
import type { AdminSubmissionItem, SubmissionItem } from "entities/submission";
import type { UserData } from "entities/user";
import { AppRoutes } from "shared/config/routes/appRoutes";
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

export const getCompletedSubmissions = <T extends SubmissionItem>(submissions: T[]) =>
    submissions.filter((submission) => submission.status === "Done");

export const getAdminSubmissionStatus = (
    submission: Pick<SubmissionItem, "status" | "verdict">,
) => {
    if (submission.status !== "Done") {
        return {
            label: submission.status === "Running" ? "Проверяется" : "В очереди",
            tone: "testing" as const,
        };
    }

    if (submission.verdict === "Accepted") {
        return { label: submission.verdict, tone: "accepted" as const };
    }

    return {
        label: submission.verdict ?? "Завершена",
        tone: "rejected" as const,
    };
};

export const getAdminSubmissionPath = (
    submission: Pick<AdminSubmissionItem, "duel_id" | "submission_id" | "task_key">,
) => {
    const detailPath = AppRoutes.DUEL_TASK_SUBMISSION_CODE.replace(
        ":duelId",
        String(submission.duel_id),
    ).replace(":submissionId", String(submission.submission_id));

    return `${detailPath}?task=${encodeURIComponent(submission.task_key)}`;
};

export const getPendingDuelsByType = (duels: PendingDuel[], type: PendingDuelType) =>
    duels.filter((duel) => duel.type === type);
