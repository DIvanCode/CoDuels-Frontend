import type { InvitationPayload } from "../types";

export type PendingInvitationFamily = "direct" | "group" | "tournament";

export const matchesPendingInvitation = (
    payload: InvitationPayload,
    state: RootState,
    expectedFamily: PendingInvitationFamily,
) => {
    const { searchNickname, searchConfigurationId, searchInvitationType, searchTournamentId } =
        state.duelSession;
    const payloadConfigId = payload.configuration_id ?? null;
    const payloadTournamentId = payload.tournament_id ?? null;

    if (expectedFamily === "tournament") {
        if (searchInvitationType !== "Tournament") return false;
        if (!searchTournamentId || payloadTournamentId !== searchTournamentId) return false;
        if (payload.opponent_nickname == null) return true;
        return (
            searchNickname === payload.opponent_nickname &&
            (searchConfigurationId ?? null) === payloadConfigId
        );
    }

    const matchesFamily =
        expectedFamily === "group"
            ? searchInvitationType === "Group"
            : searchInvitationType === "Friendly" || searchInvitationType === "Ranked";
    if (!matchesFamily) return false;
    if (payloadTournamentId !== null) return false;
    if (!payload.opponent_nickname) return false;

    return (
        searchNickname === payload.opponent_nickname &&
        (searchConfigurationId ?? null) === payloadConfigId
    );
};
