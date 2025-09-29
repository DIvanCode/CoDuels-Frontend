import { createSlice } from "@reduxjs/toolkit";
import { UserData } from "entities/user";

import { authApiSlice } from "../api/authApi";

type AuthState = {
    user: UserData | null;
    token: string | null;
};

const slice = createSlice({
    name: "auth",
    initialState: { user: null, token: null } as AuthState,
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
