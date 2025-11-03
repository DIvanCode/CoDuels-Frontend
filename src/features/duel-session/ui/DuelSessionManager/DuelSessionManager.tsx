import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();

    const user = useAppSelector(selectCurrentUser);
    const { phase } = useAppSelector(selectDuelSession);

    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

    useEffect(() => {
        if (!user) return;

        if (phase === "searching" && !subscriptionRef.current) {
            subscriptionRef.current = dispatch(
                duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(),
            );
        }

        const cleanUp = () => {
            // If there is no active duel then we unsubscribe
            if (subscriptionRef.current && phase === "idle") {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };

        cleanUp();

        return cleanUp;
    }, [phase, user, dispatch]);

    return null;
};
