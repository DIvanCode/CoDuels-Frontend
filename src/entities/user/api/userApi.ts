import { apiSlice } from "shared/api";

import { UserData } from "../model/types";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query<UserData, number>({
            query: (userId) => `/users/${userId}`,
        }),
        getMe: builder.query<UserData, void>({
            query: () => `/users/iam`,
            providesTags: ["User"],
        }),
    }),
});

export const { useGetUserQuery, useGetMeQuery } = userApiSlice;
