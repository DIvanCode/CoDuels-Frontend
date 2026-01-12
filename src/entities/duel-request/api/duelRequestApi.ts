import { apiSlice } from "shared/api";

import type { DuelRequest } from "../model/types";

export const duelRequestApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuelRequests: builder.query<DuelRequest[], void>({
            query: () => "/duels/requests",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map((request) => ({
                              type: "DuelRequest" as const,
                              id: request.opponent_nickname ?? request.created_at,
                          })),
                          { type: "DuelRequest", id: "LIST" },
                      ]
                    : [{ type: "DuelRequest", id: "LIST" }],
        }),
        denyDuelRequest: builder.mutation<void, string>({
            query: (nickname) => ({
                url: `/duels/requests/${encodeURIComponent(nickname)}/deny`,
                method: "POST",
            }),
            invalidatesTags: [{ type: "DuelRequest", id: "LIST" }],
        }),
    }),
});

export const { useGetDuelRequestsQuery, useDenyDuelRequestMutation } = duelRequestApiSlice;
