import { shouldClearSessionAfterActiveDuelNotFound } from "../../model/sessionFreshness";

export const hasStaleActiveSession = (state: RootState) => {
    return shouldClearSessionAfterActiveDuelNotFound(state.duelSession);
};
