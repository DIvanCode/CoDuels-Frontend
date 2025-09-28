import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: "/fakeApi",
        // prepareHeaders: (headers, { getState }) => {
        //   // By default, if we have a token in the store, let's use that for authenticated requests
        //   const token = (getState() as RootState)
        //   if (token) {
        //     headers.set('authorization', `Bearer ${token}`)
        //   }
        //   return headers
        // },
    }),
    endpoints: () => ({}),
});
