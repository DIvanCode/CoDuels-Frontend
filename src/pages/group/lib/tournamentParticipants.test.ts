import { describe, expect, it } from "vitest";

import type { GroupUser } from "entities/group";
import { getTournamentParticipantGroups } from "./tournamentParticipants";

const createMember = (
    id: number,
    status: GroupUser["status"],
    nickname = `user-${id}`,
): GroupUser => ({
    user: { id, nickname, rating: 1500, created_at: "2026-07-24T00:00:00Z" },
    role: "Member",
    status,
});

describe("getTournamentParticipantGroups", () => {
    it("keeps pending invitees visible but excludes them from tournament selection", () => {
        const accepted = createMember(1, "Active");
        const pending = createMember(2, "Pending");

        const groups = getTournamentParticipantGroups([accepted, pending]);

        expect(groups.accepted).toEqual([accepted]);
        expect(groups.pending).toEqual([pending]);
        expect(groups.selectable).toEqual([accepted]);
    });

    it("does not make an accepted member without a nickname selectable", () => {
        const member = createMember(1, "Active", "");

        const groups = getTournamentParticipantGroups([member]);

        expect(groups.accepted).toEqual([member]);
        expect(groups.selectable).toEqual([]);
    });
});
