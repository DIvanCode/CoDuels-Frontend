interface ReconnectableSession {
    reconnectNow(): void;
}

const activeSessions = new Map<number, ReconnectableSession>();

export const registerDuelRealtimeSession = (userId: number, session: ReconnectableSession) => {
    activeSessions.set(userId, session);

    return () => {
        if (activeSessions.get(userId) === session) activeSessions.delete(userId);
    };
};

export const requestDuelSessionReconnect = (userId: number) => {
    const session = activeSessions.get(userId);
    if (!session) return false;
    session.reconnectNow();
    return true;
};
