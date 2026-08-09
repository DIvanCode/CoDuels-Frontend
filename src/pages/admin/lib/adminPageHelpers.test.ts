import { describe, expect, it } from "vitest";

import type { PendingDuel } from "entities/duel";
import type { SubmissionItem } from "entities/submission";
import type { UserData } from "entities/user";
import {
    formatAdminDateTime,
    formatAdminWaitTime,
    getAdminSubmissionPath,
    getAdminSubmissionStatus,
    getCompletedSubmissions,
    getInactiveUsers,
    getPendingDuelsByType,
} from "./adminPageHelpers";

const user = (id: number): UserData => ({
    id,
    nickname: `user-${id}`,
    rating: 1500,
    created_at: "2026-08-09T10:00:00Z",
});

describe("admin page helpers", () => {
    it("removes active users from the remaining users list", () => {
        expect(
            getInactiveUsers([user(1), user(2), user(3)], [user(2)]).map(({ id }) => id),
        ).toEqual([1, 3]);
    });

    it("keeps only terminal submissions in the completed list", () => {
        const submissions = [
            { submission_id: 1, status: "Queued" },
            { submission_id: 2, status: "Running" },
            { submission_id: 3, status: "Done" },
        ] as SubmissionItem[];

        expect(
            getCompletedSubmissions(submissions).map(({ submission_id }) => submission_id),
        ).toEqual([3]);
    });

    it.each([
        [{ status: "Queued" }, { label: "В очереди", tone: "testing" }],
        [{ status: "Running" }, { label: "Проверяется", tone: "testing" }],
        [
            { status: "Done", verdict: "Accepted" },
            { label: "Accepted", tone: "accepted" },
        ],
        [
            { status: "Done", verdict: "Wrong answer" },
            { label: "Wrong answer", tone: "rejected" },
        ],
    ] as const)("maps submission status %# to its admin presentation", (submission, expected) => {
        expect(getAdminSubmissionStatus(submission)).toEqual(expected);
    });

    it("builds a task-aware submission detail path", () => {
        expect(
            getAdminSubmissionPath({
                duel_id: 17,
                submission_id: 42,
                task_key: "B",
            }),
        ).toBe("/duel/17/submissions/42?task=B");
    });

    it("groups pending duels by backend type", () => {
        const duels = [
            { id: 1, type: "Friendly" },
            { id: 2, type: "Group" },
            { id: 3, type: "Tournament" },
            { id: 4, type: "Friendly" },
        ] as PendingDuel[];

        expect(getPendingDuelsByType(duels, "Friendly").map(({ id }) => id)).toEqual([1, 4]);
    });

    it("formats waiting time and handles invalid dates", () => {
        expect(
            formatAdminWaitTime("2026-08-09T10:00:00Z", Date.parse("2026-08-09T10:01:05Z")),
        ).toBe("1 мин 5 сек");
        expect(formatAdminWaitTime("invalid", Date.now())).toBe("—");
        expect(formatAdminDateTime("invalid")).toBe("—");
    });
});
