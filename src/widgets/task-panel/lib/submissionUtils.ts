const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

const isTestingStatus = (status?: string, message?: string | null): boolean => {
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
    status?: string,
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

const getDisplayText = (status?: string, verdict?: string, message?: string | null): string => {
    if (!status) return "—";

    if (status === "Queued") {
        return "Queued";
    }

    if (status === "Running") {
        return message || "Running";
    }

    if (status === "Done") {
        return verdict || "—";
    }

    return status;
};

export { formatDate, getDisplayText, getVerdictVariant, isTestingStatus };
