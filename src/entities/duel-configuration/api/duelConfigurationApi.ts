import { apiSlice } from "shared/api";

import {
    CreateDuelConfigurationRequest,
    DuelConfiguration,
    UpdateDuelConfigurationRequest,
} from "../model/types";

interface UpdateDuelConfigurationArgs {
    id: number;
    body: UpdateDuelConfigurationRequest;
}

export const duelConfigurationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDuelConfigurations: builder.query<DuelConfiguration[], void>({
            query: () => "/configurations",
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
                url: "/configurations",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "DuelConfiguration", id: "LIST" }],
        }),
        updateDuelConfiguration: builder.mutation<DuelConfiguration, UpdateDuelConfigurationArgs>({
            query: ({ id, body }) => ({
                url: `/configurations/${id}`,
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
                url: `/configurations/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "DuelConfiguration", id },
                { type: "DuelConfiguration", id: "LIST" },
            ],
        }),
        getDuelConfiguration: builder.query<DuelConfiguration, number>({
            query: (id) => `/configurations/${id}`,
            providesTags: (_result, _error, id) => [{ type: "DuelConfiguration", id }],
        }),
    }),
});

export const {
    useGetDuelConfigurationsQuery,
    useCreateDuelConfigurationMutation,
    useUpdateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
    useGetDuelConfigurationQuery,
} = duelConfigurationApiSlice;
