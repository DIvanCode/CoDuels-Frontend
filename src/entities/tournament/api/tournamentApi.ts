import { apiSlice } from "shared/api";

import type { CreateTournamentRequest, Tournament } from "../model/types";

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
    }),
});

export const { useGetGroupTournamentsQuery, useCreateTournamentMutation } = tournamentApiSlice;
