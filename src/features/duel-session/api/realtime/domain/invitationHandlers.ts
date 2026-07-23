import { duelInvitationApiSlice } from "entities/duel-invitation";

import {
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setPhase,
} from "../../../model/duelSessionSlice";
import type { InvitationPayload, RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";

const invalidateInvitations = (context: DomainEventContext) => {
    if (!isCurrentDomainSession(context)) return;
    context.dispatch(
        duelInvitationApiSlice.util.invalidateTags([{ type: "DuelInvitation", id: "LIST" }]),
    );
};

const matchesPendingInvitation = (payload: InvitationPayload, state: RootState) => {
    const { searchNickname, searchConfigurationId, searchInvitationType, searchTournamentId } =
        state.duelSession;
    const payloadConfigId = payload.configuration_id ?? null;
    const payloadTournamentId = payload.tournament_id ?? null;

    if (searchInvitationType === "Tournament") {
        if (!searchTournamentId || payloadTournamentId !== searchTournamentId) return false;
        if (payload.opponent_nickname == null) return true;
        return (
            searchNickname === payload.opponent_nickname &&
            (searchConfigurationId ?? null) === payloadConfigId
        );
    }

    if (payloadTournamentId !== null) return false;
    if (!payload.opponent_nickname) return false;

    return (
        searchNickname === payload.opponent_nickname &&
        (searchConfigurationId ?? null) === payloadConfigId
    );
};

const createCanceledHandler =
    (context: DomainEventContext) => (event: { payload: InvitationPayload }) => {
        if (!isCurrentDomainSession(context)) return;
        invalidateInvitations(context);
        if (matchesPendingInvitation(event.payload, context.getState())) {
            context.dispatch(setPhase("idle"));
        }
    };

export const createInvitationHandlers = (context: DomainEventContext): RealtimeEventHandlers => ({
    DuelInvitation: [() => invalidateInvitations(context)],
    DuelInvitationCanceled: [createCanceledHandler(context)],
    GroupDuelInvitation: [() => invalidateInvitations(context)],
    GroupDuelInvitationCanceled: [createCanceledHandler(context)],
    TournamentDuelInvitation: [() => invalidateInvitations(context)],
    TournamentDuelInvitationCanceled: [createCanceledHandler(context)],
    DuelInvitationDenied: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            invalidateInvitations(context);
            if (!matchesPendingInvitation(payload, context.getState())) return;

            context.dispatch(setPhase("idle"));
            context.dispatch(setDuelCanceledOpponentNickname(payload.opponent_nickname ?? null));
            context.dispatch(setDuelCanceled(true));
        },
    ],
});
