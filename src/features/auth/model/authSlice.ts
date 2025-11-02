import { createSlice } from "@reduxjs/toolkit";

import { userApiSlice } from "entities/user";
import { authApiSlice } from "../api/authApi";
import { AuthState } from "./types";

const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
};

const slice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addMatcher(authApiSlice.endpoints.register.matchFulfilled, (state, { payload }) => {
                state.token = payload.access_token;
                state.refreshToken = payload.refresh_token;
            })
            .addMatcher(authApiSlice.endpoints.login.matchFulfilled, (state, { payload }) => {
                state.token = payload.access_token;
                state.refreshToken = payload.refresh_token;
            })
            .addMatcher(authApiSlice.endpoints.logout.matchFulfilled, (state) => {
                state.token = null;
                state.refreshToken = null;
                state.user = null;
            })
            .addMatcher(userApiSlice.endpoints.getMe.matchFulfilled, (state, { payload }) => {
                state.user = payload;
            });
    },
});

export default slice.reducer;
