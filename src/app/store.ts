import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "features/auth";
import { duelSessionReducer } from "features/duel-session";
import { apiSlice } from "shared/api";

const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
        duelSession: duelSessionReducer,
    },
    middleware: (getDefaultMiddleWare) => getDefaultMiddleWare().concat(apiSlice.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
