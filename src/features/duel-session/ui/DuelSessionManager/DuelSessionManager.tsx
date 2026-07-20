import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { selectDuelSession } from "features/duel-session/model/selectors";
import {
    dismissDuelSessionInterrupted,
    resetDuelSession,
} from "features/duel-session/model/duelSessionSlice";
import { reconcileDuelSession } from "features/duel-session/model/thunks";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, Modal } from "shared/ui";
import styles from "./DuelSessionManager.module.scss";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();

    const user = useAppSelector(selectCurrentUser);
    const { sessionInterrupted } = useAppSelector(selectDuelSession);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const reconciledUserIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!user || reconciledUserIdRef.current === user.id) return;

        reconciledUserIdRef.current = user.id;
        void dispatch(reconcileDuelSession());
    }, [user, dispatch]);

    // Full cleanup on user logout
    useEffect(() => {
        if (user) return;

        reconciledUserIdRef.current = null;
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
                        dispatch(dismissDuelSessionInterrupted());
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
