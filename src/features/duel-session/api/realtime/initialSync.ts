import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { finishActiveDuel, resetDuelSession } from "../../model/duelSessionSlice";
import { restoreActiveDuel } from "../../model/thunks";
import {
    doesDuelResultCandidateOwnSession,
    getDuelResultCandidateId,
    hasStaleActiveSession,
    isFinishedDuelResultForUser,
} from "./initialSyncState";

interface InitialSyncOptions {
    dispatch: AppDispatch;
    getState: () => RootState;
    userId: number;
}

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

    const initialState = getState();
    const resultCandidateId = getDuelResultCandidateId(initialState, userId);
    const initialSession = initialState.duelSession;
    let stopped = false;
    let abortResultVerification: (() => void) | null = null;
    let abortActiveVerification: (() => void) | null = null;
    const request = dispatch(
        duelApiSlice.endpoints.getActiveDuelId.initiate(userId, {
            forceRefetch: true,
            subscribe: false,
        }),
    );

    const isCurrentUser = () =>
        getState().auth.user?.id === userId && getState().auth.token !== null;
    const isInitialSessionStillCurrent = () => {
        const current = getState().duelSession;
        return (
            current.activeDuelId === initialSession.activeDuelId &&
            current.activeDuelUserId === initialSession.activeDuelUserId &&
            current.phase === initialSession.phase &&
            current.pendingStartedInCurrentRuntime ===
                initialSession.pendingStartedInCurrentRuntime &&
            current.pendingResult?.duelId === initialSession.pendingResult?.duelId &&
            current.pendingResult?.userId === initialSession.pendingResult?.userId
        );
    };
    const resultCandidateStillOwnsSession = (duelId: number) =>
        doesDuelResultCandidateOwnSession(getState(), duelId, userId);
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
            if (!stopped && isCurrentUser() && resultCandidateStillOwnsSession(duelId)) {
                if (isFinishedDuelResultForUser(duel, duelId, userId)) {
                    dispatch(finishActiveDuel({ duelId, userId }));
                } else {
                    dispatch(resetDuelSession());
                }
            }
        } catch (error: unknown) {
            if (
                !stopped &&
                isCurrentUser() &&
                isUnavailableResult(error) &&
                resultCandidateStillOwnsSession(duelId)
            ) {
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
        .then(async (response) => {
            if (stopped || !isCurrentUser()) return;
            if (response.duel_id !== null) {
                const verification = dispatch(
                    restoreActiveDuel({ duelId: response.duel_id, userId }),
                );
                abortActiveVerification = () => verification.abort();
                await verification;
                abortActiveVerification = null;
            } else if (resultCandidateId !== null) {
                await reconcileFinishedResult(resultCandidateId);
            } else if (isInitialSessionStillCurrent() && hasStaleActiveSession(getState())) {
                dispatch(resetDuelSession());
            }
        })
        .catch(() => undefined)
        .finally(() => request.unsubscribe());

    return {
        promise,
        abort: () => {
            stopped = true;
            request.abort();
            request.unsubscribe();
            abortResultVerification?.();
            abortActiveVerification?.();
        },
    };
};
