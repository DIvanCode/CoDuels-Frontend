import { submitCodeApiSlice, type SubmissionStatus } from "entities/submission";
import { apiSlice } from "shared/api";

import type { RealtimeEventHandlers, SubmissionStatusPayload } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";

const statusRank: Record<SubmissionStatusPayload["status"], number> = {
    Queued: 0,
    Running: 1,
    Done: 2,
};

const isForwardStatus = (
    current: SubmissionStatusPayload["status"],
    incoming: SubmissionStatusPayload["status"],
) => statusRank[incoming] >= statusRank[current];

const getDuelIdFromArgs = (args: unknown) => {
    if (typeof args === "string") return args;
    if (
        typeof args === "object" &&
        args !== null &&
        "duelId" in args &&
        typeof (args as { duelId?: string }).duelId === "string"
    ) {
        return (args as { duelId: string }).duelId;
    }
    return null;
};

const updateSubmissionCaches = (context: DomainEventContext, payload: SubmissionStatusPayload) => {
    const state = context.getState();
    const duelId = String(payload.duel_id);
    const submissionId = String(payload.submission_id);
    let foundProjection = false;

    const detailArgs = { duelId, submissionId };
    const detail = submitCodeApiSlice.endpoints.getSubmissionDetail.select(detailArgs)(state)?.data;
    if (detail) {
        foundProjection = true;
        if (isForwardStatus(detail.status, payload.status)) {
            context.dispatch(
                submitCodeApiSlice.util.updateQueryData(
                    "getSubmissionDetail",
                    detailArgs,
                    (draft) => {
                        if (!isForwardStatus(draft.status, payload.status)) return;
                        draft.status = payload.status as SubmissionStatus;
                        if (payload.verdict !== undefined) draft.verdict = payload.verdict;
                        if (payload.message !== undefined) draft.message = payload.message;
                    },
                ),
            );
        }
    }

    const apiState = state[apiSlice.reducerPath];
    if (apiState && "queries" in apiState) {
        Object.values(apiState.queries).forEach((entry) => {
            if (!entry || typeof entry !== "object") return;
            const query = entry as { endpointName?: string; originalArgs?: unknown };
            if (query.endpointName !== "getSubmissions") return;
            if (getDuelIdFromArgs(query.originalArgs) !== duelId || !query.originalArgs) return;

            const args = query.originalArgs as string | { duelId: string; taskKey?: string | null };
            const list = submitCodeApiSlice.endpoints.getSubmissions.select(args)(state)?.data;
            const current = list?.find((item) => String(item.submission_id) === submissionId);
            if (!current) return;

            foundProjection = true;
            if (!isForwardStatus(current.status, payload.status)) return;

            context.dispatch(
                submitCodeApiSlice.util.updateQueryData("getSubmissions", args, (draft) => {
                    const submission = draft.find(
                        (item) => String(item.submission_id) === submissionId,
                    );
                    if (!submission || !isForwardStatus(submission.status, payload.status)) return;
                    submission.status = payload.status as SubmissionStatus;
                    if (payload.verdict !== undefined) submission.verdict = payload.verdict;
                    if (payload.message !== undefined) submission.message = payload.message;
                }),
            );
        });
    }

    if (!foundProjection) {
        context.dispatch(
            submitCodeApiSlice.util.invalidateTags([
                { type: "Submission", id: `LIST-${duelId}` },
                { type: "Submission", id: `${duelId}-${submissionId}` },
            ]),
        );
    }
};

export const createSubmissionHandlers = (context: DomainEventContext): RealtimeEventHandlers => ({
    SubmissionStatusUpdated: [
        ({ payload }) => {
            if (isCurrentDomainSession(context)) updateSubmissionCaches(context, payload);
        },
    ],
});
