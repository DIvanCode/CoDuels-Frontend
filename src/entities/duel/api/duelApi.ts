import { apiSlice } from "shared/api";

import type {
    ActiveDuelIdResponse,
    Duel,
    GroupDuelEntry,
    PendingDuel,
    RankedDuelSearcher,
} from "../model/types";

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
        getActiveDuelId: builder.query<ActiveDuelIdResponse, number>({
            query: () => `/duels/active/id`,
            providesTags: (result) => [
                { type: "Duel", id: "ACTIVE" },
                ...(result?.duel_id === null || result?.duel_id === undefined
                    ? []
                    : [{ type: "Duel" as const, id: result.duel_id }]),
            ],
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
        getAdminPendingDuels: builder.query<PendingDuel[], void>({
            query: () => "/duels/admin/pending",
        }),
        getAdminRankedDuelSearchers: builder.query<RankedDuelSearcher[], void>({
            query: () => "/duels/admin/ranked-searchers",
        }),
        getAdminActiveDuels: builder.query<Duel[], void>({
            query: () => "/duels/admin/active",
        }),
        getAdminFinishedDuels: builder.query<Duel[], void>({
            query: () => "/duels/admin/finished",
        }),
    }),
});

export const {
    useGetDuelQuery,
    useGetAllUserDuelsQuery,
    useGetActiveDuelIdQuery,
    useGetGroupDuelsQuery,
    useGetAdminPendingDuelsQuery,
    useGetAdminRankedDuelSearchersQuery,
    useGetAdminActiveDuelsQuery,
    useGetAdminFinishedDuelsQuery,
} = duelApiSlice;
