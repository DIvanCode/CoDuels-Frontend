import type { DuelSessionState } from "./types";

export const shouldClearSessionAfterNullActiveDuel = (
    state: Pick<DuelSessionState, "phase" | "activeDuelId" | "pendingStartedInCurrentRuntime">,
) =>
    state.phase === "active" ||
    state.activeDuelId !== null ||
    (state.phase === "searching" && !state.pendingStartedInCurrentRuntime);
