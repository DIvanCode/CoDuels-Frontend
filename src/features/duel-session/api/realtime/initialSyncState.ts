import { shouldClearSessionAfterNullActiveDuel } from "../../model/sessionFreshness";

export {
    doesDuelResultCandidateOwnSession,
    getDuelResultCandidateId,
    isFinishedDuelResultForUser,
} from "../../model/sessionResult";

export const hasStaleActiveSession = (state: RootState) => {
    return shouldClearSessionAfterNullActiveDuel(state.duelSession);
};
