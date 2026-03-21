import { apiSlice } from "shared/api";

import type {
    DuelInvitation,
    DuelInvitationBaseDto,
    GroupDuelInvitationDto,
    PendingDuelType,
    TournamentDuelInvitationDto,
} from "../model/types";

export const duelInvitationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuelInvitations: builder.query<DuelInvitation[], PendingDuelType>({
            query: (type) => {
                if (type === "Group") {
                    return "/duels/group/invitations";
                }

                if (type === "Tournament") {
                    return "/duels/tournament/invitations";
                }

                return "/duels/invitations";
            },
            transformResponse: (
                response:
                    | DuelInvitationBaseDto[]
                    | GroupDuelInvitationDto[]
                    | TournamentDuelInvitationDto[],
                _meta,
                type,
            ) => {
                if (type === "Group") {
                    return (response as GroupDuelInvitationDto[]).map((invitation) => ({
                        ...invitation,
                        type: "Group" as const,
                    }));
                }

                if (type === "Tournament") {
                    return (response as TournamentDuelInvitationDto[]).map((invitation) => ({
                        ...invitation,
                        type: "Tournament" as const,
                    }));
                }

                return (response as DuelInvitationBaseDto[]).map((invitation) => ({
                    ...invitation,
                    type,
                }));
            },
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
        acceptGroupDuelInvitation: builder.mutation<
            void,
            { group_id: number; opponent_nickname: string; configuration_id?: number | null }
        >({
            query: (body) => ({
                url: "/duels/group/invitations/accept",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, body) => [
                { type: "DuelInvitation", id: "LIST" },
                { type: "Duel", id: `GROUP-${body.group_id}` },
            ],
        }),
        acceptTournamentDuelInvitation: builder.mutation<void, { tournament_id: number }>({
            query: ({ tournament_id }) => ({
                url: `/tournaments/${tournament_id}/duels/accept`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { tournament_id }) => [
                { type: "DuelInvitation", id: "LIST" },
                { type: "Tournament", id: tournament_id },
            ],
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
        createGroupDuelInvitation: builder.mutation<
            void,
            {
                group_id: number;
                user1_id: number;
                user2_id: number;
                configuration_id?: number | null;
            }
        >({
            query: (body) => ({
                url: "/duels/group/invitations",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, body) => [
                { type: "DuelInvitation", id: "LIST" },
                { type: "Duel", id: `GROUP-${body.group_id}` },
            ],
        }),
    }),
});

export const {
    useGetDuelInvitationsQuery,
    useLazyGetDuelInvitationsQuery,
    useCreateDuelInvitationMutation,
    useAcceptDuelInvitationMutation,
    useAcceptGroupDuelInvitationMutation,
    useAcceptTournamentDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useCancelDuelInvitationMutation,
    useCreateGroupDuelInvitationMutation,
} = duelInvitationApiSlice;
