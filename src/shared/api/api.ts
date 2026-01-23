import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { refreshAuthToken } from "./token/refreshAuthToken";

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const token = state.auth.token;

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    const isRefreshRequest =
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        typeof args.url === "string" &&
        args.url.includes("/users/refresh");
    const authState = api.getState() as RootState;
    const hasRefreshToken = Boolean(authState.auth.refreshToken);
    const shouldAttemptRefresh =
        !isRefreshRequest &&
        hasRefreshToken &&
        result.error &&
        (result.error.status === 401 || result.error.status === "FETCH_ERROR");

    if (shouldAttemptRefresh) {
        const newToken = await refreshAuthToken(authState, api.dispatch);

        if (newToken) {
            result = await baseQuery(args, api, extraOptions);
            if (result.error && result.error.status === 401) {
                api.dispatch({ type: "auth/logout" });
            }
        }
    }

    return result;
};

export const apiSlice = createApi({
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Duel", "DuelConfiguration", "DuelInvitation", "Submission", "User"],
    endpoints: () => ({}),
});
