import { apiSlice } from "shared/api";
import {
    SubmitCodeRequestData,
    SubmitCodeResponse,
    SubmissionDetail,
    SubmissionItem,
} from "../ui/SubmitCodeButton/types";
import { submissionsApiSlice } from "widgets/task-panel/api/submissionsApi";

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
            async onQueryStarted({ duelId }, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;

                    dispatch(
                        submissionsApiSlice.util.updateQueryData(
                            "getSubmissions",
                            duelId,
                            (draft) => {
                                const exists = draft.some(
                                    (s) => String(s.submission_id) === String(result.submission_id),
                                );
                                if (!exists) {
                                    const newSubmission: SubmissionItem = {
                                        submission_id: String(result.submission_id),
                                        status: "Queued",
                                        created_at: new Date().toISOString(),
                                    };
                                    draft.unshift(newSubmission);
                                }
                            },
                        ),
                    );
                } catch {}
            },
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
