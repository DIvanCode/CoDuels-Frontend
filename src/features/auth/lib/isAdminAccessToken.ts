const decodeTokenPayload = (token: string): unknown => {
    const payload = token.split(".")[1];

    if (!payload) {
        return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
        "=",
    );

    try {
        return JSON.parse(atob(paddedPayload));
    } catch {
        return null;
    }
};

export const isAdminAccessToken = (token: string | null) => {
    if (!token) {
        return false;
    }

    const payload = decodeTokenPayload(token);

    if (typeof payload !== "object" || payload === null || !("is_admin" in payload)) {
        return false;
    }

    const isAdmin = payload.is_admin;

    return isAdmin === true || (typeof isAdmin === "string" && isAdmin.toLowerCase() === "true");
};
