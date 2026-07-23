export const selectRealtimeUserId = (state: RootState) =>
    state.auth.token ? (state.auth.user?.id ?? null) : null;
