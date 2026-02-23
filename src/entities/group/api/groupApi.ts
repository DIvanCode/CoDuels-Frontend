import { apiSlice } from "shared/api";

import type { CreateGroupRequest, Group, GroupUser, InviteGroupUserRequest } from "../model/types";

export const groupApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroups: builder.query<Group[], void>({
            query: () => "/groups",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Group" as const, id })),
                          { type: "Group", id: "LIST" },
                      ]
                    : [{ type: "Group", id: "LIST" }],
        }),
        createGroup: builder.mutation<Group, CreateGroupRequest>({
            query: (body) => ({
                url: "/groups",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Group", id: "LIST" }],
        }),
        getGroup: builder.query<Group, number>({
            query: (id) => `/groups/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Group", id }],
        }),
        getGroupUsers: builder.query<GroupUser[], number>({
            query: (id) => `/groups/${id}/users`,
            providesTags: (_result, _error, id) => [{ type: "Group", id }],
        }),
        updateGroup: builder.mutation<Group, { id: number; name: string }>({
            query: ({ id, name }) => ({
                url: `/groups/${id}`,
                method: "PUT",
                body: { name },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Group", id },
                { type: "Group", id: "LIST" },
            ],
        }),
        changeGroupUserRole: builder.mutation<void, { id: number; user_id: number; role: string }>({
            query: ({ id, user_id, role }) => ({
                url: `/groups/${id}/role`,
                method: "POST",
                body: { user_id, role },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "Group", id }],
        }),
        excludeGroupUser: builder.mutation<void, { id: number; user_id: number }>({
            query: ({ id, user_id }) => ({
                url: `/groups/${id}/exclude`,
                method: "POST",
                body: { user_id },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "Group", id }],
        }),
        leaveGroup: builder.mutation<void, number>({
            query: (id) => ({
                url: `/groups/${id}/leave`,
                method: "POST",
            }),
            invalidatesTags: [{ type: "Group", id: "LIST" }],
        }),
        inviteGroupUser: builder.mutation<void, InviteGroupUserRequest>({
            query: (body) => ({
                url: "/groups/invitations",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, body) => [{ type: "Group", id: body.group_id }],
        }),
    }),
});

export const {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useGetGroupQuery,
    useGetGroupUsersQuery,
    useUpdateGroupMutation,
    useChangeGroupUserRoleMutation,
    useExcludeGroupUserMutation,
    useLeaveGroupMutation,
    useInviteGroupUserMutation,
} = groupApiSlice;
