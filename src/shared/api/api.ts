import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: "/fakeApi",
    }),
    tagTypes: ["Duel"],
    endpoints: () => ({}),
});
