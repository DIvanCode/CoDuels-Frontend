import { apiSlice } from "shared/api";

import type { GroupInvitation, GroupInvitationRequest } from "../model/types";

export const groupInvitationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroupInvitations: builder.query<GroupInvitation[], void>({
            query: () => "/groups/invitations",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map((invitation) => ({
                              type: "GroupInvitation" as const,
                              id: invitation.group_id,
                          })),
                          { type: "GroupInvitation", id: "LIST" },
                      ]
                    : [{ type: "GroupInvitation", id: "LIST" }],
        }),
        acceptGroupInvitation: builder.mutation<void, GroupInvitationRequest>({
            query: (body) => ({
                url: "/groups/invitations/accept",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                { type: "GroupInvitation", id: "LIST" },
                { type: "Group", id: "LIST" },
            ],
        }),
        denyGroupInvitation: builder.mutation<void, GroupInvitationRequest>({
            query: (body) => ({
                url: "/groups/invitations/deny",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "GroupInvitation", id: "LIST" }],
        }),
        cancelGroupInvitation: builder.mutation<void, { group_id: number; user_id: number }>({
            query: (body) => ({
                url: "/groups/invitations/cancel",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, body) => [
                { type: "GroupInvitation", id: "LIST" },
                { type: "Group", id: body.group_id },
            ],
        }),
    }),
});

export const {
    useGetGroupInvitationsQuery,
    useLazyGetGroupInvitationsQuery,
    useAcceptGroupInvitationMutation,
    useDenyGroupInvitationMutation,
    useCancelGroupInvitationMutation,
} = groupInvitationApiSlice;
