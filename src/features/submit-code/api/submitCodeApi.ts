import { apiSlice } from "shared/api";
import {
    SubmissionDetail,
    SubmissionItem,
    SubmitCodeRequestData,
    SubmitCodeResponse,
} from "../model/types";

interface SubmissionsQueryArg {
    duelId: string;
    taskKey?: string | null;
}

const normalizeSubmissionsArg = (arg: string | SubmissionsQueryArg) => {
    if (typeof arg === "string") {
        return { duelId: arg, taskKey: null };
    }

    return arg;
};

export const submitCodeApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        submitCode: builder.mutation<
            SubmitCodeResponse,
            { duelId: string; data: SubmitCodeRequestData; taskKey?: string | null }
        >({
            query: ({ duelId, data }) => ({
                url: `/duels/${duelId}/submissions`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_result, _error, { duelId }) => [
                { type: "Submission", id: `LIST-${duelId}` },
            ],
            async onQueryStarted({ duelId, data, taskKey }, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;

                    dispatch(
                        submitCodeApiSlice.util.updateQueryData(
                            "getSubmissions",
                            { duelId, taskKey: taskKey ?? null },
                            (draft) => {
                                const exists = draft.some(
                                    (s) => String(s.submission_id) === String(result.submission_id),
                                );
                                if (!exists) {
                                    const newSubmission: SubmissionItem = {
                                        submission_id: String(result.submission_id),
                                        status: "Queued",
                                        language: data.language,
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

        getSubmissions: builder.query<SubmissionItem[], string | SubmissionsQueryArg>({
            query: (arg) => {
                const { duelId, taskKey } = normalizeSubmissionsArg(arg);
                return {
                    url: `/duels/${duelId}/submissions`,
                    params: {
                        ...(taskKey ? { taskKey } : {}),
                    },
                };
            },
            providesTags: (result, _error, arg) => {
                const { duelId } = normalizeSubmissionsArg(arg);
                return result
                    ? [
                          ...result.map(({ submission_id }) => ({
                              type: "Submission" as const,
                              id: `${duelId}-${submission_id}`,
                          })),
                          { type: "Submission", id: `LIST-${duelId}` },
                      ]
                    : [{ type: "Submission", id: `LIST-${duelId}` }];
            },
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
                const current = normalizeSubmissionsArg(currentArg);
                const previous = normalizeSubmissionsArg(previousArg);
                return current.duelId !== previous.duelId || current.taskKey !== previous.taskKey;
            },
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
                            { duelId, taskKey: null },
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
                                        created_at: data.created_at,
                                        language: data.language,
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
