import { apiSlice } from "shared/api";
import {
    SubmitCodeRequestData,
    SubmitCodeResponse,
    SubmissionDetail,
    SubmissionItem,
} from "../model/types";

export const submitCodeApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        submitCode: builder.mutation<
            SubmitCodeResponse,
            { duelId: string; data: SubmitCodeRequestData }
        >({
            query: ({ duelId, data }) => ({
                url: `/duels/${duelId}/submissions`,
                method: "POST",
                body: data,
                credentials: "include",
            }),
        }),

        getSubmissions: builder.query<SubmissionItem[], string>({
            query: (duelId: string) => ({
                url: `/duels/${duelId}/submissions`,
                credentials: "include",
            }),
        }),

        getSubmissionDetail: builder.query<
            SubmissionDetail,
            { duelId: string; submissionId: string }
        >({
            query: ({ duelId, submissionId }) => ({
                url: `/duels/${duelId}/submissions/${submissionId}`,
                credentials: "include",
            }),
        }),
    }),
});

export const { useSubmitCodeMutation, useGetSubmissionsQuery, useGetSubmissionDetailQuery } =
    submitCodeApiSlice;
