import { useEffect } from "react";

import type { SubmissionStatus } from "features/submit-code";

const SUBMISSION_STATUS_POLLING_INTERVAL_MS = 2_000;

export const shouldPollSubmissionStatus = (status?: SubmissionStatus): boolean =>
    status === "Queued" || status === "Running";

export const useSubmissionStatusPolling = (shouldPoll: boolean, refetch: () => unknown) => {
    useEffect(() => {
        if (!shouldPoll) return;

        const intervalId = window.setInterval(() => {
            void refetch();
        }, SUBMISSION_STATUS_POLLING_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [refetch, shouldPoll]);
};
