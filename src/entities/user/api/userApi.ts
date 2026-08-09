import { apiSlice } from "shared/api";

import { UserData } from "../model/types";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query<UserData, number>({
            query: (userId) => `/users/${userId}`,
        }),
        getUserByNickname: builder.query<UserData, string>({
            query: (nickname) => `/users/nickname/${encodeURIComponent(nickname)}`,
        }),
        getMe: builder.query<UserData, void>({
            query: () => `/users/iam`,
            providesTags: [{ type: "User", id: "ME" }],
        }),
        getAdminUsers: builder.query<UserData[], void>({
            query: () => "/users/admin/all",
        }),
        getAdminActiveUsers: builder.query<UserData[], void>({
            query: () => "/users/admin/active",
        }),
        createTicket: builder.mutation<{ ticket: string }, void>({
            query: () => ({
                url: "/users/ticket",
                method: "POST",
            }),
        }),
    }),
});

export const {
    useGetUserQuery,
    useLazyGetUserQuery,
    useGetUserByNicknameQuery,
    useLazyGetUserByNicknameQuery,
    useGetMeQuery,
    useGetAdminUsersQuery,
    useGetAdminActiveUsersQuery,
} = userApiSlice;
