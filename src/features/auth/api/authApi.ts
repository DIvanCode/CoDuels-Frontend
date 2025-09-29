import { UserData } from "entities/user";
import { apiSlice } from "shared/api";

import { LoginCredentials, RegistrationCredentials } from "../model/types";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<{ user: UserData; token: string }, RegistrationCredentials>({
            query: (credentials: RegistrationCredentials) => ({
                url: "/register",
                method: "POST",
                body: { ...credentials },
            }),
        }),
        login: builder.mutation<{ user: UserData; token: string }, LoginCredentials>({
            query: (credentials: LoginCredentials) => ({
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

export const { useLoginMutation, useLogoutMutation, useRegisterMutation } = authApiSlice;
