type GetMeState = {
    isError: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    error?: unknown;
};

export type HomeRouteView = "admin" | "home" | "landing" | "loading";

const isUnauthorized = (state: GetMeState) =>
    state.isError &&
    typeof state.error === "object" &&
    state.error !== null &&
    "status" in state.error &&
    state.error.status === 401;

export const resolveHomeRouteView = (
    token: string | null,
    state: GetMeState,
    isAdmin: boolean,
): HomeRouteView => {
    if (!token || isUnauthorized(state)) {
        return "landing";
    }

    if (state.isSuccess) {
        return isAdmin ? "admin" : "home";
    }

    return "loading";
};
