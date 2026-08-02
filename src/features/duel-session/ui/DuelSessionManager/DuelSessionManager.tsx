import { useEffect, useRef, useState } from "react";

import { useGetActiveDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { startDuelRealtimeSession } from "features/duel-session/api/duelSessionApi";
import { requestDuelSessionReconnect } from "features/duel-session/api/realtime/connectionRegistry";
import { selectRealtimeUserId } from "features/duel-session/api/realtime/sessionIdentity";
import { selectDuelSession } from "features/duel-session/model/selectors";
import {
    acknowledgeDuelResult,
    resetDuelSession,
    setActiveDuel,
} from "features/duel-session/model/duelSessionSlice";
import { removeLegacyDuelResultDismissals } from "features/duel-session/model/duelResultAcknowledgement";
import { restoreDuelSession } from "features/duel-session/model/thunks";
import { useDuelResultAcknowledgement } from "features/duel-session/model/useDuelResultAcknowledgement";
import { useAppDispatch, useAppSelector, useAppStore } from "shared/lib/storeHooks";
import { Button, Modal } from "shared/ui";

import styles from "./DuelSessionManager.module.scss";

const isNotFoundError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404;

export const DuelSessionManager = () => {
    const dispatch = useAppDispatch();
    const store = useAppStore();
    const userId = useAppSelector(selectCurrentUser)?.id ?? null;
    const realtimeUserId = useAppSelector(selectRealtimeUserId);
    const { phase, activeDuelId, activeDuelUserId, sessionInterrupted, pendingResult } =
        useAppSelector(selectDuelSession);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const previousUserIdRef = useRef<number | null>(userId);

    const { data: activeDuel, error: activeDuelError } = useGetActiveDuelQuery(undefined, {
        skip: realtimeUserId === null,
        pollingInterval: phase === "searching" ? 2_000 : 0,
        skipPollingIfUnfocused: true,
        refetchOnReconnect: true,
    });
    const pendingResultIsAcknowledged = useDuelResultAcknowledgement(
        pendingResult?.userId ?? null,
        pendingResult?.duelId ?? null,
    );

    useEffect(() => removeLegacyDuelResultDismissals(), []);

    useEffect(() => {
        const isCurrentUserParticipant = (activeDuel?.participants ?? []).some(
            (participant) => participant.id === userId,
        );
        if (activeDuel?.status === "InProgress" && userId !== null && isCurrentUserParticipant) {
            dispatch(setActiveDuel({ duelId: activeDuel.id, userId }));
        }
    }, [activeDuel, userId, dispatch]);

    useEffect(() => {
        const shouldVerifyPersistedDuel = phase === "idle" || isNotFoundError(activeDuelError);

        if (
            userId !== null &&
            activeDuelId !== null &&
            (activeDuelUserId === userId || activeDuelUserId === null) &&
            shouldVerifyPersistedDuel
        ) {
            dispatch(restoreDuelSession(activeDuelId));
        }
    }, [userId, activeDuelId, activeDuelUserId, phase, activeDuelError, dispatch]);

    useEffect(() => {
        if (userId === null || previousUserIdRef.current !== userId) {
            dispatch(resetDuelSession());
        }
        previousUserIdRef.current = userId;
    }, [userId, dispatch]);

    useEffect(() => {
        if (pendingResult && pendingResultIsAcknowledged) {
            dispatch(acknowledgeDuelResult(pendingResult));
        }
    }, [pendingResult, pendingResultIsAcknowledged, dispatch]);

    useEffect(() => {
        if (realtimeUserId === null) return;
        return startDuelRealtimeSession({
            dispatch,
            getState: store.getState,
            userId: realtimeUserId,
        });
    }, [realtimeUserId, dispatch, store]);

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
