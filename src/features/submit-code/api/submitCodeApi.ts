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
            async onQueryStarted({ duelId }, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;

                    dispatch(
                        submitCodeApiSlice.util.updateQueryData(
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
                } catch (error) {
                    // Silently ignore optimistic cache update failure
                    console.debug("submitCode onQueryStarted failed", error);
                }
            },
        }),

        getSubmissions: builder.query<SubmissionItem[], string>({
            query: (duelId: string) => ({
                url: `/duels/${duelId}/submissions`,
            }),
            providesTags: (result, _error, duelId) =>
                result
                    ? [
                          ...result.map(({ submission_id }) => ({
                              type: "Submission" as const,
                              id: `${duelId}-${submission_id}`,
                          })),
                          { type: "Submission", id: `LIST-${duelId}` },
                      ]
                    : [{ type: "Submission", id: `LIST-${duelId}` }],
            merge: (currentCache, newItems) => {
                if (!currentCache) return newItems;

                const resultMap = new Map<string, SubmissionItem>();

                currentCache.forEach((item) => {
                    resultMap.set(String(item.submission_id), item);
                });

                newItems.forEach((newItem) => {
                    resultMap.set(String(newItem.submission_id), newItem);
                });

                return Array.from(resultMap.values());
            },
            forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
        }),

        getSubmissionDetail: builder.query<
            SubmissionDetail,
            { duelId: string; submissionId: string }
        >({
            query: ({ duelId, submissionId }) => ({
                url: `/duels/${duelId}/submissions/${submissionId}`,
            }),
            providesTags: (_result, _error, { duelId, submissionId }) => [
                { type: "Submission", id: `${duelId}-${submissionId}` },
            ],
            async onQueryStarted({ duelId, submissionId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        submitCodeApiSlice.util.updateQueryData(
                            "getSubmissions",
                            duelId,
                            (draft) => {
                                const submissionIndex = draft.findIndex(
                                    (s) => String(s.submission_id) === String(submissionId),
                                );
                                if (submissionIndex !== -1) {
                                    draft[submissionIndex] = {
                                        ...draft[submissionIndex],
                                        status: data.status,
                                        verdict: data.verdict,
                                    };
                                } else {
                                    const newSubmission: SubmissionItem = {
                                        submission_id: String(data.submission_id),
                                        status: data.status,
                                        verdict: data.verdict,
                                        created_at: data.submit_time,
                                    };
                                    draft.unshift(newSubmission);
                                }
                            },
                        ),
                    );
                } catch (error) {
                    console.debug("getSubmissionDetail onQueryStarted failed", error);
                }
            },
        }),
    }),
});

export const { useSubmitCodeMutation, useGetSubmissionsQuery, useGetSubmissionDetailQuery } =
    submitCodeApiSlice;
