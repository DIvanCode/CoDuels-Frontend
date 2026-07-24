import type { KnownRealtimeEvent, KnownRealtimeEventType, RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { createDuelHandlers } from "./duelHandlers";
import { createGroupHandlers } from "./groupHandlers";
import { createInvitationHandlers } from "./invitationHandlers";
import { createSubmissionHandlers } from "./submissionHandlers";
import { createTournamentHandlers } from "./tournamentHandlers";

type UntypedHandlers = Partial<
    Record<KnownRealtimeEventType, ((event: KnownRealtimeEvent) => void)[]>
>;

const mergeHandlers = (...groups: RealtimeEventHandlers[]) => {
    const merged: UntypedHandlers = {};

    groups.forEach((group) => {
        const entries = Object.entries(group) as [
            KnownRealtimeEventType,
            ((event: KnownRealtimeEvent) => void)[],
        ][];
        entries.forEach(([type, handlers]) => {
            merged[type] = [...(merged[type] ?? []), ...handlers];
        });
    });

    return merged as RealtimeEventHandlers;
};

export const createDomainHandlers = (context: DomainEventContext) =>
    mergeHandlers(
        createDuelHandlers(context),
        createInvitationHandlers(context),
        createGroupHandlers(context),
        createTournamentHandlers(context),
        createSubmissionHandlers(context),
    );
