import { apiSlice } from "shared/api";

import { Duel } from "../model/types";

export const duelApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuel: builder.query<Duel, number>({
            query: (duelId: number) => `/duels/${duelId}`,
            providesTags: (_result, _error, arg) => [{ type: "Duel", id: arg }],
        }),
    }),
});

export const { useGetDuelQuery } = duelApiSlice;
