import { duelApiSlice } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { setActiveDuelId, clearDuelSession } from "features/duel-session/model/duelSessionSlice";
import { clearCodeForDuel, clearAllCodes } from "widgets/code-panel/model/codeEditorSlice";
import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();

    const user = useAppSelector(selectCurrentUser);
    const { phase, activeDuelId } = useAppSelector(selectDuelSession);

    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const restorationAttemptedRef = useRef(false);

    useEffect(() => {
        if (!user || restorationAttemptedRef.current) return;

        if (activeDuelId && phase === "idle") {
            restorationAttemptedRef.current = true;

            dispatch(duelApiSlice.endpoints.getDuel.initiate(activeDuelId))
                .then((result) => {
                    if ("data" in result && result.data) {
                        const duel = result.data;

                        if (duel.status === "InProgress") {
                            dispatch(setActiveDuelId(duel.id));

                            if (!subscriptionRef.current) {
                                subscriptionRef.current = dispatch(
                                    duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(),
                                );
                            }
                        } else {
                            dispatch(clearDuelSession());
                            dispatch(clearCodeForDuel(String(activeDuelId)));
                        }
                    } else {
                        dispatch(clearDuelSession());
                        dispatch(clearCodeForDuel(String(activeDuelId)));
                    }
                })
                .catch(() => {
                    dispatch(clearDuelSession());
                    dispatch(clearCodeForDuel(String(activeDuelId)));
                });
        }
    }, [user, activeDuelId, phase, dispatch]);

    useEffect(() => {
        if (!user) {
            dispatch(clearDuelSession());
            dispatch(clearAllCodes());
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            return;
        }
    }, [user, dispatch]);

    const previousUserRef = useRef<number | null>(null);
    useEffect(() => {
        if (user && user.id !== previousUserRef.current) {
            if (previousUserRef.current !== null) {
                dispatch(clearAllCodes());
            }
            previousUserRef.current = user.id;
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (!user) return;

        if ((phase === "searching" || phase === "active") && !subscriptionRef.current) {
            subscriptionRef.current = dispatch(
                duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(),
            );
        }

        const cleanUp = () => {
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
