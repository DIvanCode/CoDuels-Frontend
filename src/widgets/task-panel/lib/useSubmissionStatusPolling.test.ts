import { describe, expect, it } from "vitest";

import { shouldPollSubmissionStatus } from "./useSubmissionStatusPolling";

describe("submission status polling", () => {
    it("polls only while judging can still advance", () => {
        expect(shouldPollSubmissionStatus("Queued")).toBe(true);
        expect(shouldPollSubmissionStatus("Running")).toBe(true);
        expect(shouldPollSubmissionStatus("Done")).toBe(false);
        expect(shouldPollSubmissionStatus(undefined)).toBe(false);
    });
});
