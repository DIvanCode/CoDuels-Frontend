import { apiSlice } from "shared/api";

import { Duel, GroupDuelEntry } from "../model/types";

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
        getActiveDuel: builder.query<Duel, void>({
            query: () => `/duels/active`,
            providesTags: (result) => [{ type: "Duel", id: result?.id ?? "ACTIVE" }],
        }),
        getGroupDuels: builder.query<GroupDuelEntry[], number>({
            query: (groupId) => `/groups/${groupId}/duels`,
            providesTags: (result, _error, groupId) =>
                result
                    ? [
                          ...result
                              .map((entry) => entry.duel?.id)
                              .filter((id): id is number => typeof id === "number")
                              .map((id) => ({ type: "Duel" as const, id })),
                          { type: "Duel", id: `GROUP-${groupId}` },
                      ]
                    : [{ type: "Duel", id: `GROUP-${groupId}` }],
        }),
    }),
});

export const {
    useGetDuelQuery,
    useGetAllUserDuelsQuery,
    useGetActiveDuelQuery,
    useGetGroupDuelsQuery,
} = duelApiSlice;
