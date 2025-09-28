import { UserData } from "entities/user";
import { apiSlice } from "shared/api";

import { AuthCredentials } from "../model/types";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<{ user: UserData; token: string }, AuthCredentials>({
            query: (credentials: AuthCredentials) => ({
                url: "/login",
                method: "POST",
                body: { ...credentials },
            }),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/logout",
                method: "POST",
            }),
        }),
    }),
});

export const { useLoginMutation, useLogoutMutation } = authApiSlice;
