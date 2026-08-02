import type { GroupUser } from "entities/group";

export const getTournamentParticipantGroups = (members: GroupUser[]) => {
    const accepted = members.filter((member) => member.status === "Active");

    return {
        accepted,
        pending: members.filter((member) => member.status === "Pending"),
        selectable: accepted.filter((member) => Boolean(member.user.nickname)),
    };
};
