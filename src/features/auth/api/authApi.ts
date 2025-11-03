import { apiSlice } from "shared/api/";

import { AuthCredentials, RefreshTokenRequest, TokenPair } from "../model/types";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<TokenPair, AuthCredentials>({
            query: (credentials: AuthCredentials) => ({
                url: "/users/register",
                method: "POST",
                body: { ...credentials },
            }),
            invalidatesTags: ["User"],
        }),
        login: builder.mutation<TokenPair, AuthCredentials>({
            query: (credentials: AuthCredentials) => ({
                url: "/users/login",
                method: "POST",
                body: { ...credentials },
            }),
            invalidatesTags: ["User"],
        }),
        refresh: builder.mutation<TokenPair, RefreshTokenRequest>({
            query: (credentials: RefreshTokenRequest) => ({
                url: "/users/refresh",
                method: "POST",
                body: { ...credentials },
            }),
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useRefreshMutation } = authApiSlice;
