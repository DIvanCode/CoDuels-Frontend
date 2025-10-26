import { apiSlice } from "shared/api";

export interface SubmitCodeRequest {
    user_id: string;
    solution: string;
    language: string;
}

export interface SubmitCodeResponse {
    submission_id: string;
    status: string;
}

export interface SubmissionItem {
    submission_id: string;
    status: string;
    verdict?: string;
    created_at: string;
}

export interface SubmissionDetail {
    submission_id: string;
    solution: string;
    language: string;
    status: string;
    verdict?: string;
    created_at: string;
}

export interface DuelInfo {
    id: number;
    status: "in_progress" | "finished" | "pending";
    task_id: string;
    starts_at: string;
    deadline_at: string;
}

export const submitCodeApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        submitCode: builder.mutation<
            SubmitCodeResponse,
            { duelId: string; data: SubmitCodeRequest }
        >({
            query: ({ duelId, data }) => ({
                url: `/duels/${duelId}/submit`,
                method: "POST",
                body: data,
                credentials: "include",
            }),
        }),

        getDuelInfo: builder.query<DuelInfo, string>({
            query: (duelId: string) => ({
                url: `/duels/${duelId}`,
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

export const {
    useSubmitCodeMutation,
    useGetDuelInfoQuery,
    useGetSubmissionsQuery,
    useGetSubmissionDetailQuery,
} = submitCodeApiSlice;
