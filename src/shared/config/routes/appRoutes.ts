export const enum AppRoutes {
    INDEX = "/",
    AUTH = "/auth",
    PROFILE = "/profile/:userId",
    GROUPS = "/groups",
    GROUP = "/groups/:groupId",
    DUEL = "/duel/:duelId",
    DUEL_TASK_DESCRIPTION = "/duel/:duelId/description",
    DUEL_TASK_SUBMISSIONS = "/duel/:duelId/submissions",
    DUEL_TASK_SUBMISSION_CODE = "/duel/:duelId/submissions/:submissionId",
}
