const ACKNOWLEDGEMENT_KEY_PREFIX = "duel-result-ack:v1";
const LEGACY_RESULT_KEY = /^duel:\d+:resultDismissed$/;
const ACKNOWLEDGEMENT_EVENT = "coduels:duel-result-acknowledged";

interface AcknowledgementDetail {
    duelId: number;
    userId: number;
}

const getLocalStorage = () => {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const getDuelResultAcknowledgementKey = (userId: number, duelId: number) =>
    `${ACKNOWLEDGEMENT_KEY_PREFIX}:${userId}:${duelId}`;

export const isDuelResultAcknowledged = (
    userId: number,
    duelId: number,
    storage: Pick<Storage, "getItem"> | null = getLocalStorage(),
) => {
    if (!storage) return false;

    try {
        return storage.getItem(getDuelResultAcknowledgementKey(userId, duelId)) === "1";
    } catch {
        return false;
    }
};

export const persistDuelResultAcknowledgement = (
    userId: number,
    duelId: number,
    storage: Pick<Storage, "setItem"> | null = getLocalStorage(),
) => {
    if (!storage) return;

    try {
        storage.setItem(getDuelResultAcknowledgementKey(userId, duelId), "1");
    } catch {
        // The Redux transition still acknowledges the result for this runtime.
    }
};

export const removeLegacyDuelResultDismissals = (
    storage: Pick<Storage, "key" | "length" | "removeItem"> | null = getLocalStorage(),
) => {
    if (!storage) return;

    try {
        const legacyKeys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key && LEGACY_RESULT_KEY.test(key)) legacyKeys.push(key);
        }
        legacyKeys.forEach((key) => storage.removeItem(key));
    } catch {
        // Browser storage can be unavailable even when the Storage API exists.
    }
};

export const notifyDuelResultAcknowledged = (userId: number, duelId: number) => {
    persistDuelResultAcknowledgement(userId, duelId);
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<AcknowledgementDetail>(ACKNOWLEDGEMENT_EVENT, {
            detail: { duelId, userId },
        }),
    );
};

export const subscribeToDuelResultAcknowledgement = (
    userId: number,
    duelId: number,
    listener: () => void,
) => {
    if (typeof window === "undefined") return () => undefined;

    const key = getDuelResultAcknowledgementKey(userId, duelId);
    const handleStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
    };
    const handleSameTab = (event: Event) => {
        const detail = (event as CustomEvent<AcknowledgementDetail>).detail;
        if (detail?.userId === userId && detail.duelId === duelId) listener();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ACKNOWLEDGEMENT_EVENT, handleSameTab);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(ACKNOWLEDGEMENT_EVENT, handleSameTab);
    };
};
