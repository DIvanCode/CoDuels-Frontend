export const enum AppRoutes {
    INDEX = "/",
    AUTH = "/auth",
    PROFILE = "/profile/:userNickname",
    GROUPS = "/groups",
    GROUP = "/groups/:groupId",
    GROUP_MEMBERS = "/groups/:groupId/members",
    GROUP_DUELS = "/groups/:groupId/duels",
    GROUP_TOURNAMENTS = "/groups/:groupId/tournaments",
    DUEL = "/duel/:duelId",
    DUEL_TASK_DESCRIPTION = "/duel/:duelId/description",
    DUEL_TASK_SUBMISSIONS = "/duel/:duelId/submissions",
    DUEL_TASK_SUBMISSION_CODE = "/duel/:duelId/submissions/:submissionId",
}
