import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { resetDuelSession, setActiveDuelId } from "../../model/duelSessionSlice";

interface InitialSyncOptions {
    dispatch: AppDispatch;
    getState: () => RootState;
    userId: number;
}

const isNotFound = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404;

export const startInitialSync = ({ dispatch, getState, userId }: InitialSyncOptions) => {
    dispatch(
        apiSlice.util.invalidateTags([
            "Duel",
            "DuelConfiguration",
            "DuelInvitation",
            "Group",
            "GroupInvitation",
            "Submission",
            "Tournament",
            "User",
        ]),
    );

    const request = dispatch(
        duelApiSlice.endpoints.getActiveDuel.initiate(undefined, {
            forceRefetch: true,
            subscribe: false,
        }),
    );

    const isCurrentUser = () => getState().auth.user?.id === userId;
    const promise = request
        .unwrap()
        .then((duel) => {
            if (!isCurrentUser()) return;
            if (duel.status === "InProgress") {
                dispatch(setActiveDuelId(duel.id));
            } else {
                dispatch(resetDuelSession());
            }
        })
        .catch((error: unknown) => {
            if (isCurrentUser() && isNotFound(error)) dispatch(resetDuelSession());
        })
        .finally(() => request.unsubscribe());

    return {
        promise,
        abort: () => {
            request.abort();
            request.unsubscribe();
        },
    };
};
