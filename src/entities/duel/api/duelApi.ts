import { apiSlice } from "shared/api";

import { Duel } from "../model/types";

export const duelApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuel: builder.query<Duel, string>({
            query: (duelId: string) => `/duels/${duelId}`,
            // NOTE: теги на будущее, когда получать список дуэлей пользователя будем
            providesTags: (_result, _error, arg) => [{ type: "Duel", id: arg }],
        }),
    }),
});

export const { useGetDuelQuery } = duelApiSlice;
