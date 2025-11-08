import { apiSlice } from "shared/api";
import { SubmissionDetail, SubmissionItem } from "features/submit-code/ui/SubmitCodeButton/types";

export const submissionsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSubmissions: builder.query<SubmissionItem[], string>({
            query: (duelId: string) => ({
                url: `/duels/${duelId}/submissions`,
                method: "GET",
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
            forceRefetch: ({ currentArg, previousArg }) => {
                return currentArg !== previousArg;
            },
        }),

        getSubmissionDetail: builder.query<
            SubmissionDetail,
            { duelId: string; submissionId: string }
        >({
            query: ({ duelId, submissionId }) => ({
                url: `/duels/${duelId}/submissions/${submissionId}`,
                method: "GET",
            }),
            providesTags: (_result, _error, { duelId, submissionId }) => [
                { type: "Submission", id: `${duelId}-${submissionId}` },
            ],
            async onQueryStarted({ duelId, submissionId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        submissionsApiSlice.util.updateQueryData(
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
                } catch {}
            },
        }),
    }),
});

export const { useGetSubmissionDetailQuery, useGetSubmissionsQuery } = submissionsApiSlice;
