import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { selectDuelSession } from "features/duel-session/model/selectors";
import {
    resetDuelSession,
    setPhase,
    setSessionInterrupted,
} from "features/duel-session/model/duelSessionSlice";
import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "shared/lib/storeHooks";
import { restoreDuelSession } from "features/duel-session/model/thunks";
import { Button, Modal } from "shared/ui";
import styles from "./DuelSessionManager.module.scss";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();

    const user = useAppSelector(selectCurrentUser);
    const { phase, activeDuelId, sessionInterrupted } = useAppSelector(selectDuelSession);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const didHandleReloadRef = useRef(false);

    useEffect(() => {
        // If user logged in and he has an active duel but phase is idle, try to restore session
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

    // Keep WebSocket connection alive while user is on the site
    useEffect(() => {
        if (!user && subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
            return;
        }

        if (user && !subscriptionRef.current) {
            subscriptionRef.current = dispatch(
                duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(),
            );
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (!user || didHandleReloadRef.current) return;

        const navigationEntry = performance.getEntriesByType("navigation")[0] as
            | PerformanceNavigationTiming
            | undefined;
        const navigationType = navigationEntry?.type ?? null;

        if (navigationType === "reload" && phase === "searching" && !activeDuelId) {
            dispatch(setPhase("idle"));
        }

        didHandleReloadRef.current = true;
    }, [user, phase, activeDuelId, dispatch]);

    const handleReconnect = () => {
        if (!user) return;
        if (isReconnecting) return;
        setIsReconnecting(true);
        window.location.reload();
    };

    useEffect(() => {
        if (!sessionInterrupted) {
            setIsReconnecting(false);
        }
    }, [sessionInterrupted]);

    useEffect(() => {
        if (!sessionInterrupted || !isReconnecting) return;

        const timeoutId = setTimeout(() => {
            if (sessionInterrupted) {
                setIsReconnecting(false);
            }
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [sessionInterrupted, isReconnecting]);

    return (
        <>
            {sessionInterrupted && (
                <Modal
                    title="Соединение прервано"
                    showCloseButton={false}
                    closeOnOverlay={false}
                    onClose={() => {
                        dispatch(setSessionInterrupted(false));
                        setIsReconnecting(false);
                    }}
                >
                    <div className={styles.resultContent}>
                        <p className={styles.description}>
                            Сессия была разорвана. Хотите переподключиться?
                        </p>
                        <div className={styles.actions}>
                            <Button onClick={handleReconnect} disabled={isReconnecting}>
                                {isReconnecting ? "Переподключение..." : "Переподключиться"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};
