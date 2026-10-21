import { duelInvitationApiSlice } from "entities/duel-invitation";

import {
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setPhase,
} from "../../../model/duelSessionSlice";
import type { InvitationPayload, RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";
import { matchesPendingInvitation, type PendingInvitationFamily } from "./invitationMatching";

const refreshInvitations = (
    context: DomainEventContext,
    type: "Ranked" | "Group" | "Tournament",
) => {
    if (!isCurrentDomainSession(context)) return;
    void context.dispatch(
        duelInvitationApiSlice.endpoints.getDuelInvitations.initiate(type, {
            subscribe: false,
            forceRefetch: true,
        }),
    );
};

const createCanceledHandler =
    (
        context: DomainEventContext,
        expectedFamily: PendingInvitationFamily,
        type: "Ranked" | "Group" | "Tournament",
    ) =>
    (event: { payload: InvitationPayload }) => {
        if (!isCurrentDomainSession(context)) return;
        refreshInvitations(context, type);
        if (matchesPendingInvitation(event.payload, context.getState(), expectedFamily)) {
            context.dispatch(setPhase("idle"));
        }
    };

export const createInvitationHandlers = (context: DomainEventContext): RealtimeEventHandlers => ({
    DuelInvitation: [() => refreshInvitations(context, "Ranked")],
    DuelInvitationCanceled: [createCanceledHandler(context, "direct", "Ranked")],
    GroupDuelInvitation: [() => refreshInvitations(context, "Group")],
    GroupDuelInvitationCanceled: [createCanceledHandler(context, "group", "Group")],
    TournamentDuelInvitation: [() => refreshInvitations(context, "Tournament")],
    TournamentDuelInvitationCanceled: [createCanceledHandler(context, "tournament", "Tournament")],
    DuelInvitationDenied: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            refreshInvitations(context, "Ranked");
            if (!matchesPendingInvitation(payload, context.getState(), "direct")) return;

            const isFriendlyDuel =
                context.getState().duelSession.searchInvitationType === "Friendly";
            context.dispatch(setPhase("idle"));
            if (isFriendlyDuel) return;
            context.dispatch(setDuelCanceledOpponentNickname(payload.opponent_nickname ?? null));
            context.dispatch(setDuelCanceled(true));
        },
    ],
});
