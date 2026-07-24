import { apiSlice } from "shared/api";

import type { RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";

export const createTournamentHandlers = (context: DomainEventContext): RealtimeEventHandlers => {
    const refreshTournaments = () => {
        if (!isCurrentDomainSession(context)) return;
        context.dispatch(apiSlice.util.invalidateTags(["Tournament"]));
    };

    return {
        TournamentDuelInvitation: [refreshTournaments],
        TournamentDuelInvitationCanceled: [refreshTournaments],
        DuelFinished: [refreshTournaments],
    };
};
