import type { SubmissionStatus } from "./types";

const submissionStatusRank: Record<SubmissionStatus, number> = {
    Queued: 0,
    Running: 1,
    Done: 2,
};

export const isSubmissionStatusForward = (current: SubmissionStatus, incoming: SubmissionStatus) =>
    submissionStatusRank[incoming] >= submissionStatusRank[current];
