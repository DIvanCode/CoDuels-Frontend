import type { SubmissionStatus } from "features/submit-code";
import { fromApiLanguage, LanguageValue } from "shared/config";
import { formatIsoDateTimeWithSeconds } from "shared/lib/isoTimestamp";

const formatDate = formatIsoDateTimeWithSeconds;

const isTestingStatus = (status?: SubmissionStatus, message?: string | null): boolean => {
    if (!status) return false;

    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "done") {
        return false;
    }

    if (normalizedStatus === "queued" || normalizedStatus === "running") {
        return true;
    }

    const normalizedMessage = message?.toLowerCase() || "";
    if (
        normalizedMessage.includes("compiled") ||
        normalizedMessage.includes("passed test") ||
        normalizedMessage.includes("testing") ||
        normalizedMessage.includes("running test")
    ) {
        return true;
    }

    return false;
};

const getVerdictVariant = (
    verdict?: string,
    status?: SubmissionStatus,
    message?: string | null,
): "success" | "failure" | "testing" => {
    if (status === "Done" && verdict === "Accepted") {
        return "success";
    }

    if (isTestingStatus(status, message)) {
        return "testing";
    }

    return "failure";
};

const getDisplayText = (
    status?: SubmissionStatus,
    verdict?: string,
    message?: string | null,
): string => {
    if (!status) return "—";

    if (status === "Queued") {
        return "Queued";
    }

    if (status === "Running") {
        return message || "Testing in progress";
    }

    if (status === "Done") {
        return verdict || "—";
    }

    return status;
};

const mapLanguageToLanguageValue = (language: string): LanguageValue => fromApiLanguage(language);

export {
    formatDate,
    getDisplayText,
    getVerdictVariant,
    isTestingStatus,
    mapLanguageToLanguageValue,
};
