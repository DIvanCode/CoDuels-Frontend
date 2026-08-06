import { apiSlice } from "shared/api";

import {
    CreateDuelConfigurationRequest,
    DuelConfiguration,
    TaskLevelRatingRanges,
    UpdateDuelConfigurationRequest,
} from "../model/types";

interface UpdateDuelConfigurationArgs {
    id: number;
    body: UpdateDuelConfigurationRequest;
}

export const duelConfigurationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTaskLevelRatingRanges: builder.query<TaskLevelRatingRanges, void>({
            query: () => "/duels/task-level-rating-ranges",
        }),
        getDuelConfigurations: builder.query<DuelConfiguration[], void>({
            query: () => "/duels/configurations",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "DuelConfiguration" as const, id })),
                          { type: "DuelConfiguration", id: "LIST" },
                      ]
                    : [{ type: "DuelConfiguration", id: "LIST" }],
        }),
        createDuelConfiguration: builder.mutation<
            DuelConfiguration,
            CreateDuelConfigurationRequest
        >({
            query: (body) => ({
                url: "/duels/configurations",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelConfiguration", id: "LIST" }],
        }),
        updateDuelConfiguration: builder.mutation<DuelConfiguration, UpdateDuelConfigurationArgs>({
            query: ({ id, body }) => ({
                url: `/duels/configurations/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "DuelConfiguration", id },
                { type: "DuelConfiguration", id: "LIST" },
            ],
        }),
        deleteDuelConfiguration: builder.mutation<void, number>({
            query: (id) => ({
                url: `/duels/configurations/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "DuelConfiguration", id },
                { type: "DuelConfiguration", id: "LIST" },
            ],
        }),
        getDuelConfiguration: builder.query<DuelConfiguration, number>({
            query: (id) => `/duels/configurations/${id}`,
            providesTags: (_result, _error, id) => [{ type: "DuelConfiguration", id }],
        }),
    }),
});

export const {
    useGetTaskLevelRatingRangesQuery,
    useGetDuelConfigurationsQuery,
    useCreateDuelConfigurationMutation,
    useUpdateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
    useGetDuelConfigurationQuery,
} = duelConfigurationApiSlice;
