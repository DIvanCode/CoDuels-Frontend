import { describe, expect, it } from "vitest";

import { isSubmissionStatusForward } from "./submissionStatus";

describe("submission status ordering", () => {
    it("accepts forward and equal states", () => {
        expect(isSubmissionStatusForward("Queued", "Running")).toBe(true);
        expect(isSubmissionStatusForward("Running", "Done")).toBe(true);
        expect(isSubmissionStatusForward("Done", "Done")).toBe(true);
    });

    it("rejects stale HTTP or realtime states after a terminal result", () => {
        expect(isSubmissionStatusForward("Done", "Running")).toBe(false);
        expect(isSubmissionStatusForward("Done", "Queued")).toBe(false);
        expect(isSubmissionStatusForward("Running", "Queued")).toBe(false);
    });
});
