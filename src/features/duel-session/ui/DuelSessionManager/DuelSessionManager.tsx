import { useEffect, useRef, useState } from "react";

import { selectCurrentUser } from "entities/user";
import { duelSessionApiSlice } from "features/duel-session/api/duelSessionApi";
import { requestDuelSessionReconnect } from "features/duel-session/api/realtime/connectionRegistry";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { resetDuelSession } from "features/duel-session/model/duelSessionSlice";
import { restoreDuelSession } from "features/duel-session/model/thunks";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, Modal } from "shared/ui";

import styles from "./DuelSessionManager.module.scss";

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectCurrentUser)?.id ?? null;
    const { phase, activeDuelId, sessionInterrupted } = useAppSelector(selectDuelSession);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const previousUserIdRef = useRef<number | null>(userId);

    useEffect(() => {
        if (userId !== null && activeDuelId && phase === "idle") {
            dispatch(restoreDuelSession(activeDuelId));
        }
    }, [userId, activeDuelId, phase, dispatch]);

    useEffect(() => {
        if (userId === null || previousUserIdRef.current !== userId) {
            dispatch(resetDuelSession());
        }
        previousUserIdRef.current = userId;
    }, [userId, dispatch]);

    useEffect(() => {
        if (userId === null) return;
        const subscription = dispatch(
            duelSessionApiSlice.endpoints.subscribeToDuelStates.initiate(userId),
        );
        return () => subscription.unsubscribe();
    }, [userId, dispatch]);

    const handleReconnect = () => {
        if (userId === null || isReconnecting) return;
        setIsReconnecting(requestDuelSessionReconnect(userId));
    };

    useEffect(() => {
        if (!sessionInterrupted) setIsReconnecting(false);
    }, [sessionInterrupted]);

    useEffect(() => {
        if (!sessionInterrupted || !isReconnecting) return;

        const timeoutId = setTimeout(() => setIsReconnecting(false), 5_000);
        return () => clearTimeout(timeoutId);
    }, [sessionInterrupted, isReconnecting]);

    return (
        <>
            {sessionInterrupted && (
                <Modal
                    title="Соединение прервано"
                    showCloseButton={false}
                    closeOnOverlay={false}
                    onClose={() => undefined}
                >
                    <div className={styles.resultContent}>
                        <p className={styles.description}>
                            Соединение восстанавливается автоматически. Можно повторить попытку
                            немедленно.
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
