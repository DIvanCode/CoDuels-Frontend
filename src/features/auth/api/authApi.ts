import { apiSlice, TokenPair } from "shared/api/";
import { AuthCredentials } from "../model/types";

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
    }),
});

export const { useLoginMutation, useRegisterMutation } = authApiSlice;
