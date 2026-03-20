import { apiSlice } from "shared/api";

import type {
    CreateTournamentRequest,
    Tournament,
    TournamentDetailsResponse,
} from "../model/types";

export const tournamentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroupTournaments: builder.query<Tournament[], number>({
            query: (groupId) => `/groups/${groupId}/tournaments`,
            providesTags: (result, _error, groupId) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Tournament" as const, id })),
                          { type: "Tournament", id: `GROUP-${groupId}` },
                      ]
                    : [{ type: "Tournament", id: `GROUP-${groupId}` }],
        }),
        createTournament: builder.mutation<Tournament, CreateTournamentRequest>({
            query: (body) => ({
                url: "/tournaments",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, body) => [
                { type: "Tournament", id: `GROUP-${body.group_id}` },
            ],
        }),
        getTournament: builder.query<TournamentDetailsResponse, number>({
            query: (id) => `/tournaments/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Tournament", id }],
        }),
        startTournament: builder.mutation<void, { id: number; groupId: number }>({
            query: ({ id }) => ({
                url: `/tournaments/${id}/start`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id, groupId }) => [
                { type: "Tournament", id },
                { type: "Tournament", id: `GROUP-${groupId}` },
            ],
        }),
    }),
});

export const {
    useGetGroupTournamentsQuery,
    useCreateTournamentMutation,
    useGetTournamentQuery,
    useStartTournamentMutation,
} = tournamentApiSlice;
