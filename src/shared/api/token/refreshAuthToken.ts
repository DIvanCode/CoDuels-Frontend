import { Mutex } from "async-mutex";
import { TokenPairStruct } from "./types";

// We are using async-mutex to prevent multiple calls to refreshAuthToken
// when multiple calls fail with 401 Unauthorized errors
const refreshMutex = new Mutex();

async function unsafeRefreshAuthToken(
    state: RootState,
    dispatch: AppDispatch,
): Promise<string | null> {
    try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: state.auth.refreshToken }),
        });

        if (!res.ok) {
            dispatch({ type: "auth/logout" });
            return null;
        }

        const refreshResult = await res.json();

        if (TokenPairStruct.is(refreshResult)) {
            dispatch({ type: "auth/setTokens", payload: refreshResult });
            return refreshResult.access_token;
        } else {
            dispatch({ type: "auth/logout" });
            return null;
        }
    } catch (error) {
        console.error("refreshAuthToken error:", error);
        dispatch({ type: "auth/logout" });
        return null;
    }
}

export async function refreshAuthToken(
    state: RootState,
    dispatch: AppDispatch,
): Promise<string | null> {
    await refreshMutex.waitForUnlock();

    if (!refreshMutex.isLocked()) {
        const release = await refreshMutex.acquire();
        try {
            return await unsafeRefreshAuthToken(state, dispatch);
        } finally {
            release();
        }
    } else {
        await refreshMutex.waitForUnlock();
        // After the mutex is unlocked, token has already been refreshed by another process
        return state.auth.token;
    }
}
