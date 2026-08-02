import { useCallback, useSyncExternalStore } from "react";

import {
    isDuelResultAcknowledged,
    subscribeToDuelResultAcknowledgement,
} from "./duelResultAcknowledgement";

export const useDuelResultAcknowledgement = (userId: number | null, duelId: number | null) => {
    const subscribe = useCallback(
        (listener: () => void) =>
            userId === null || duelId === null
                ? () => undefined
                : subscribeToDuelResultAcknowledgement(userId, duelId, listener),
        [duelId, userId],
    );
    const getSnapshot = useCallback(
        () =>
            userId !== null && duelId !== null ? isDuelResultAcknowledged(userId, duelId) : false,
        [duelId, userId],
    );

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
};
