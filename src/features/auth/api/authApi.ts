import { apiSlice } from "shared/api";

import { AuthCredentials, TokenResponse } from "../model/types";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<TokenResponse, AuthCredentials>({
            query: (credentials: AuthCredentials) => ({
                url: "/users/register",
                method: "POST",
                body: { ...credentials },
            }),
            invalidatesTags: ["User"],
        }),
        login: builder.mutation<TokenResponse, AuthCredentials>({
            query: (credentials: AuthCredentials) => ({
                url: "/users/login",
                method: "POST",
                body: { ...credentials },
            }),
            invalidatesTags: ["User"],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/users/logout",
                method: "POST",
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const { useLoginMutation, useLogoutMutation, useRegisterMutation } = authApiSlice;
