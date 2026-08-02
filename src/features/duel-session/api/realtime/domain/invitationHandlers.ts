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

const invalidateInvitations = (context: DomainEventContext) => {
    if (!isCurrentDomainSession(context)) return;
    context.dispatch(
        duelInvitationApiSlice.util.invalidateTags([{ type: "DuelInvitation", id: "LIST" }]),
    );
};

const createCanceledHandler =
    (context: DomainEventContext, expectedFamily: PendingInvitationFamily) =>
    (event: { payload: InvitationPayload }) => {
        if (!isCurrentDomainSession(context)) return;
        invalidateInvitations(context);
        if (matchesPendingInvitation(event.payload, context.getState(), expectedFamily)) {
            context.dispatch(setPhase("idle"));
        }
    };

export const createInvitationHandlers = (context: DomainEventContext): RealtimeEventHandlers => ({
    DuelInvitation: [() => invalidateInvitations(context)],
    DuelInvitationCanceled: [createCanceledHandler(context, "direct")],
    GroupDuelInvitation: [() => invalidateInvitations(context)],
    GroupDuelInvitationCanceled: [createCanceledHandler(context, "group")],
    TournamentDuelInvitation: [() => invalidateInvitations(context)],
    TournamentDuelInvitationCanceled: [createCanceledHandler(context, "tournament")],
    DuelInvitationDenied: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            invalidateInvitations(context);
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
