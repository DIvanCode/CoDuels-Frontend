export const selectThemeState = (state: RootState) => state.theme;

export const selectThemeMode = (state: RootState) => selectThemeState(state).mode;
