import { apiSlice } from "shared/api";

import type { DuelInvitation } from "../model/types";

export const duelInvitationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuelInvitations: builder.query<DuelInvitation[], void>({
            query: () => "/duels/invitations",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map((invitation) => ({
                              type: "DuelInvitation" as const,
                              id: invitation.opponent_nickname ?? invitation.created_at,
                          })),
                          { type: "DuelInvitation", id: "LIST" },
                      ]
                    : [{ type: "DuelInvitation", id: "LIST" }],
        }),
        createDuelInvitation: builder.mutation<
            void,
            { opponent_nickname: string; configuration_id?: number | null }
        >({
            query: (body) => ({
                url: "/duels/invitations",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelInvitation", id: "LIST" }],
        }),
        acceptDuelInvitation: builder.mutation<
            void,
            { opponent_nickname: string; configuration_id?: number | null }
        >({
            query: (body) => ({
                url: "/duels/invitations/accept",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelInvitation", id: "LIST" }],
        }),
        denyDuelInvitation: builder.mutation<
            void,
            { opponent_nickname: string; configuration_id?: number | null }
        >({
            query: (body) => ({
                url: "/duels/invitations/deny",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelInvitation", id: "LIST" }],
        }),
        cancelDuelInvitation: builder.mutation<
            void,
            { opponent_nickname: string; configuration_id?: number | null }
        >({
            query: (body) => ({
                url: "/duels/invitations/cancel",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelInvitation", id: "LIST" }],
        }),
    }),
});

export const {
    useGetDuelInvitationsQuery,
    useLazyGetDuelInvitationsQuery,
    useCreateDuelInvitationMutation,
    useAcceptDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useCancelDuelInvitationMutation,
} = duelInvitationApiSlice;
