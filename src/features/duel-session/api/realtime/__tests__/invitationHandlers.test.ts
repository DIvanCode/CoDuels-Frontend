import { describe, expect, it } from "vitest";

import { matchesPendingInvitation } from "../domain/invitationMatching";

const createState = (searchInvitationType: "Friendly" | "Group") =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: {
            searchNickname: "opponent",
            searchConfigurationId: 3,
            searchInvitationType,
            searchTournamentId: null,
        },
    }) as RootState;

describe("invitation cancellation handlers", () => {
    it("does not clear a direct invitation when a matching group duel is canceled", () => {
        const cancellation = {
            opponent_nickname: "opponent",
            configuration_id: 3,
            group_name: "Group",
        };

        expect(matchesPendingInvitation(cancellation, createState("Friendly"), "group")).toBe(
            false,
        );
        expect(matchesPendingInvitation(cancellation, createState("Group"), "group")).toBe(true);
    });
});
