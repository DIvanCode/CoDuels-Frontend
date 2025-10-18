import { apiSlice } from "shared/api";

import { UserData } from "../model/types";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query<UserData, string>({
            query: (userId) => `/user/${userId}`,
        }),
    }),
});

export const { useGetUserQuery } = userApiSlice;
