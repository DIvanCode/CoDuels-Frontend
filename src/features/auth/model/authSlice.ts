import { createSlice } from "@reduxjs/toolkit";

import { AuthState } from "./types";
import { authApiSlice } from "../api/authApi";

const initialState: AuthState = {
    user: null,
    token: null,
};

const slice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addMatcher(authApiSlice.endpoints.register.matchFulfilled, (state, { payload }) => {
                state.token = payload.token;
                state.user = payload.user;
            })
            .addMatcher(authApiSlice.endpoints.login.matchFulfilled, (state, { payload }) => {
                state.token = payload.token;
                state.user = payload.user;
            })
            .addMatcher(authApiSlice.endpoints.logout.matchFulfilled, (state) => {
                state.token = null;
                state.user = null;
            });
    },
});

export default slice.reducer;
