import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";

// import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
// import { authActions, TokenPairStruct } from "features/auth"; // TODO: нарушает fsd & создает circular import

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const token = state.auth.token;

        if (token) {
            headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

// TODO: нарушает fsd & создает circular import
// const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
//     args,
//     api,
//     extraOptions
// ) => {
//     let result = await baseQuery(args, api, extraOptions);

//     if (result.error && result.error.status === 401) {
//         const state = api.getState() as RootState;
//         const refreshToken = state.auth.refreshToken;

//         if (!refreshToken) {
//             api.dispatch(authActions.logout());
//             return result;
//         }

//         const refreshResult = await baseQuery(
//             {
//                 url: "/users/refresh",
//                 method: "POST",
//                 body: { refresh_token: refreshToken },
//             },
//             api,
//             extraOptions
//         );

//         if (refreshResult.data) {
//             const tokenPair = TokenPairStruct.create(refreshResult.data);

//             api.dispatch(authActions.setTokens(tokenPair));
//             result = await baseQuery(args, api, extraOptions);
//         } else {
//             api.dispatch(authActions.logout());
//         }
//     }

//     return result;
// };

export const apiSlice = createApi({
    baseQuery: baseQuery,
    tagTypes: ["Duel", "User"],
    endpoints: () => ({}),
});
