import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { authReducer } from "features/auth";
import { duelSessionReducer } from "features/duel-session";
import codeEditorReducer from "widgets/code-panel/model/codeEditorSlice";
import { apiSlice } from "shared/api";

const authPersistConfig = {
    key: "auth",
    storage,
    version: 1,
    whitelist: ["user", "token", "refreshToken"],
};

const duelSessionPersistConfig = {
    key: "duelSession",
    storage,
    version: 1,
    whitelist: ["activeDuelId", "lastEventId"],
};

const codeEditorPersistConfig = {
    key: "codeEditor",
    storage,
    version: 1,
    whitelist: ["codesByDuelId"],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedDuelSessionReducer = persistReducer(duelSessionPersistConfig, duelSessionReducer);
const persistedCodeEditorReducer = persistReducer(codeEditorPersistConfig, codeEditorReducer);

const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: persistedAuthReducer,
        duelSession: persistedDuelSessionReducer,
        codeEditor: persistedCodeEditorReducer,
    },
    middleware: (getDefaultMiddleWare) =>
        getDefaultMiddleWare({
            serializableCheck: {
                ignoredActions: [
                    "persist/PERSIST",
                    "persist/REHYDRATE",
                    "persist/PAUSE",
                    "persist/PURGE",
                    "persist/REGISTER",
                ],
            },
        }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
