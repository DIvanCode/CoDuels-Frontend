import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { userApiSlice } from "entities/user";
import { authApiSlice } from "../api/authApi";
import { AuthState, TokenPair } from "./types";

const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
};

const applyTokens = (state: AuthState, tokens: TokenPair) => {
    state.token = tokens.access_token;
    state.refreshToken = tokens.refresh_token;
};

const slice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setTokens: (state, { payload }: PayloadAction<TokenPair>) => applyTokens(state, payload),
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(authApiSlice.endpoints.login.matchFulfilled, (state, { payload }) =>
                applyTokens(state, payload),
            )
            .addMatcher(authApiSlice.endpoints.register.matchFulfilled, (state, { payload }) =>
                applyTokens(state, payload),
            )
            // TODO: мб еще добавить refresh token
            .addMatcher(userApiSlice.endpoints.getMe.matchFulfilled, (state, { payload }) => {
                state.user = payload;
            });
    },
});

export const authActions = slice.actions;
export default slice.reducer;
