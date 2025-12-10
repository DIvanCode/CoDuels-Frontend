import { apiSlice } from "shared/api";

import { Duel } from "../model/types";

export const duelApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuel: builder.query<Duel, number>({
            query: (duelId: number) => `/duels/${duelId}`,
            providesTags: (_result, _error, arg) => [{ type: "Duel", id: arg }],
        }),
        getAllUserDuels: builder.query<Duel[], number>({
            query: (userId) => `/duels?userId=${userId}`,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Duel" as const, id })),
                          { type: "Duel", id: "LIST" },
                      ]
                    : [{ type: "Duel", id: "LIST" }],
        }),
        getCurrentDuel: builder.query<Duel, void>({
            query: () => `/duels/current`,
            providesTags: (result) => [{ type: "Duel", id: result?.id ?? "CURRENT" }],
        }),
    }),
});

export const { useGetDuelQuery, useGetAllUserDuelsQuery, useGetCurrentDuelQuery } = duelApiSlice;
