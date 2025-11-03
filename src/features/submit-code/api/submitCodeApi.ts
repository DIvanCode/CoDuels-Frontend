import { apiSlice } from "shared/api";
import {
    SubmitCodeRequestData,
    SubmitCodeResponse,
    SubmissionDetail,
    SubmissionItem,
} from "../ui/SubmitCodeButton/types";

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
            }),
        }),

        getSubmissions: builder.query<SubmissionItem[], string>({
            query: (duelId: string) => ({
                url: `/duels/${duelId}/submissions`,
            }),
        }),

        getSubmissionDetail: builder.query<
            SubmissionDetail,
            { duelId: string; submissionId: string }
        >({
            query: ({ duelId, submissionId }) => ({
                url: `/duels/${duelId}/submissions/${submissionId}`,
            }),
        }),
    }),
});

export const { useSubmitCodeMutation, useGetSubmissionsQuery, useGetSubmissionDetailQuery } =
    submitCodeApiSlice;
