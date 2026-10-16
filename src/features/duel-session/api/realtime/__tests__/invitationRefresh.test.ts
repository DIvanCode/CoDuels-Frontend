import { describe, expect, it, vi } from "vitest";

import { createGroupHandlers } from "../domain/groupHandlers";
import { createInvitationHandlers } from "../domain/invitationHandlers";
import type { DomainEventContext } from "../domain/context";
import type { KnownRealtimeEventType } from "../types";

vi.mock("../../../model/duelSessionSlice", () => ({
    setPhase: (phase: string) => ({ type: "duelSession/setPhase", payload: phase }),
    setDuelCanceled: (value: boolean) => ({ type: "duelSession/setDuelCanceled", payload: value }),
    setDuelCanceledOpponentNickname: (nickname: string | null) => ({
        type: "duelSession/setDuelCanceledOpponentNickname",
        payload: nickname,
    }),
}));

vi.mock("entities/duel-invitation", () => ({
    duelInvitationApiSlice: {
        endpoints: {
            getDuelInvitations: {
                initiate: (type: string, options: unknown) => ({
                    type: "duelInvitation/fetch",
                    payload: { type, options },
                }),
            },
        },
    },
}));
vi.mock("entities/group-invitation", () => ({
    groupInvitationApiSlice: {
        endpoints: {
            getGroupInvitations: {
                initiate: (_arg: unknown, options: unknown) => ({
                    type: "groupInvitation/fetch",
                    payload: options,
                }),
            },
        },
    },
}));
vi.mock("shared/api", () => ({
    apiSlice: { util: { invalidateTags: (tags: unknown) => ({ type: "api/invalidate", tags }) } },
}));

const contextForUser = (currentUserId = 7) => {
    const dispatch = vi.fn();
    const context: DomainEventContext = {
        dispatch: dispatch as unknown as AppDispatch,
        getState: () =>
            ({
                auth: { user: { id: currentUserId } },
                duelSession: { phase: "idle", searchInvitationType: null },
            }) as RootState,
        userId: 7,
        reconcile: vi.fn(),
    };
    return { context, dispatch };
};

describe("invitation realtime refresh", () => {
    it.each([
        ["DuelInvitation", "Ranked"],
        ["DuelInvitationCanceled", "Ranked"],
        ["DuelInvitationDenied", "Ranked"],
        ["GroupDuelInvitation", "Group"],
        ["GroupDuelInvitationCanceled", "Group"],
        ["TournamentDuelInvitation", "Tournament"],
        ["TournamentDuelInvitationCanceled", "Tournament"],
    ] as const)("fetches the %s list without a mounted Home page", (eventType, type) => {
        const { context, dispatch } = contextForUser();
        const handlers = createInvitationHandlers(context);
        const handler = handlers[eventType as KnownRealtimeEventType]?.[0];
        expect(handler).toBeDefined();
        handler?.({
            type: eventType,
            payload: { opponent_nickname: "opponent" },
            eventId: null,
        } as never);

        expect(dispatch).toHaveBeenCalledWith({
            type: "duelInvitation/fetch",
            payload: { type, options: { subscribe: false, forceRefetch: true } },
        });
    });

    it.each(["GroupInvitation", "GroupInvitationCanceled"] as const)(
        "fetches group memberships for %s on every page",
        (eventType) => {
            const { context, dispatch } = contextForUser();
            const handlers = createGroupHandlers(context);
            handlers[eventType]?.[0]({
                type: eventType,
                payload: { group_id: 3 },
                eventId: null,
            } as never);

            expect(dispatch).toHaveBeenCalledWith({
                type: "groupInvitation/fetch",
                payload: { subscribe: false, forceRefetch: true },
            });
        },
    );

    it("ignores an invitation event after the authenticated user changes", () => {
        const { context, dispatch } = contextForUser(8);
        const handlers = createInvitationHandlers(context);
        handlers.DuelInvitation?.[0]({
            type: "DuelInvitation",
            payload: { opponent_nickname: "opponent" },
            eventId: null,
        });
        expect(dispatch).not.toHaveBeenCalled();
    });
});
