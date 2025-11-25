import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { resetDuelSession } from "features/duel-session/model/duelSessionSlice";
import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";
import { restoreDuelSession } from "features/duel-session/model/thunks";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();

    const user = useAppSelector(selectCurrentUser);
    const { phase, activeDuelId } = useAppSelector(selectDuelSession);

    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

    useEffect(() => {
        // If user logged in and  he has an active duel but phase is idle, try to restore session
        if (user && activeDuelId && phase === "idle") {
            dispatch(restoreDuelSession(activeDuelId));
        }
    }, [user, activeDuelId, phase, dispatch]);

    // Full cleanup on user logout
    useEffect(() => {
        if (user) return;

        dispatch(resetDuelSession());
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }
    }, [user, dispatch]);

    // Manage SSE subscription based on duel session phase
    useEffect(() => {
        if ((phase === "searching" || phase === "active") && !subscriptionRef.current) {
            subscriptionRef.current = dispatch(
                duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(),
            );
        }

        return () => {
            if (subscriptionRef.current && phase === "idle") {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [phase, user, dispatch]);

    return null;
};
