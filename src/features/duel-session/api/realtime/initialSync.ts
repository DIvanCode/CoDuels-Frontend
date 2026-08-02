import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { finishActiveDuel, resetDuelSession, setActiveDuel } from "../../model/duelSessionSlice";
import {
    getDuelResultCandidateId,
    hasStaleActiveSession,
    isFinishedDuelResultForUser,
} from "./initialSyncState";

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

const isUnavailableResult = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    ((error as { status?: number }).status === 403 ||
        (error as { status?: number }).status === 404);

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

    const resultCandidateId = getDuelResultCandidateId(getState(), userId);
    let stopped = false;
    let abortResultVerification: (() => void) | null = null;
    const request = dispatch(
        duelApiSlice.endpoints.getActiveDuel.initiate(undefined, {
            forceRefetch: true,
            subscribe: false,
        }),
    );

    const isCurrentUser = () => getState().auth.user?.id === userId;
    const reconcileFinishedResult = async (duelId: number) => {
        const detailRequest = dispatch(
            duelApiSlice.endpoints.getDuel.initiate(duelId, {
                forceRefetch: true,
                subscribe: false,
            }),
        );
        const abortCurrentVerification = () => {
            detailRequest.abort();
            detailRequest.unsubscribe();
        };
        abortResultVerification = abortCurrentVerification;

        try {
            const duel = await detailRequest.unwrap();
            if (!stopped && isCurrentUser()) {
                if (isFinishedDuelResultForUser(duel, duelId, userId)) {
                    dispatch(finishActiveDuel({ duelId, userId }));
                } else {
                    dispatch(resetDuelSession());
                }
            }
        } catch (error: unknown) {
            if (!stopped && isCurrentUser() && isUnavailableResult(error)) {
                dispatch(resetDuelSession());
            }
        } finally {
            detailRequest.unsubscribe();
            if (abortResultVerification === abortCurrentVerification) {
                abortResultVerification = null;
            }
        }
    };
    const promise = request
        .unwrap()
        .then((duel) => {
            if (!isCurrentUser()) return;
            if (duel.status === "InProgress") {
                dispatch(setActiveDuel({ duelId: duel.id, userId }));
            } else {
                dispatch(resetDuelSession());
            }
        })
        .catch(async (error: unknown) => {
            if (!stopped && isCurrentUser() && isNotFound(error)) {
                if (resultCandidateId !== null) {
                    await reconcileFinishedResult(resultCandidateId);
                } else if (hasStaleActiveSession(getState())) {
                    dispatch(resetDuelSession());
                }
            }
        })
        .finally(() => request.unsubscribe());

    return {
        promise,
        abort: () => {
            stopped = true;
            request.abort();
            request.unsubscribe();
            abortResultVerification?.();
        },
    };
};
