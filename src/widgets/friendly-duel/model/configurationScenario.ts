import type { FriendlyDuelState } from "./types";

export const isFriendlyDuelConfigurationScenarioActive = (state: FriendlyDuelState) =>
    state.status === "configuring";
