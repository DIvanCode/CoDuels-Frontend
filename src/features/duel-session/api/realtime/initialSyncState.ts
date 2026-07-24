export const hasStaleActiveSession = (state: RootState) => {
    const { phase, activeDuelId } = state.duelSession;
    return phase === "active" || activeDuelId !== null;
};
