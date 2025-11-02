import { RootState } from "app/store";

export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;
