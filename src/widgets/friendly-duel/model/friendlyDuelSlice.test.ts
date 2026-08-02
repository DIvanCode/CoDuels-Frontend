import { describe, expect, it } from "vitest";

import reducer, {
    beginFriendlyDuelPending,
    cancelFriendlyDuel,
    failFriendlyDuelCancellation,
    matchFriendlyDuel,
    openFriendlyDuel,
    requestFriendlyDuelCancellation,
    returnToFriendlyDuelConfiguration,
    selectFriendlyDuelConfiguration,
    setFriendlyDuelNickname,
    showFriendlyDuelOpponentStep,
} from "./friendlyDuelSlice";
import { isFriendlyDuelConfigurationScenarioActive } from "./configurationScenario";

const createPendingState = () => {
    let state = reducer(undefined, openFriendlyDuel());
    state = reducer(state, selectFriendlyDuelConfiguration(11));
    state = reducer(state, showFriendlyDuelOpponentStep());
    state = reducer(state, setFriendlyDuelNickname("opponent"));
    return reducer(state, beginFriendlyDuelPending());
};

describe("friendly duel state machine", () => {
    it("moves from configuration to pending and then to matched", () => {
        let state = createPendingState();
        state = reducer(state, matchFriendlyDuel());

        expect(state).toMatchObject({
            status: "matched",
            nickname: "opponent",
            configurationId: 11,
        });
    });

    it("ignores a second cancel and a late match after a user cancellation", () => {
        let state = createPendingState();
        state = reducer(state, requestFriendlyDuelCancellation());
        state = reducer(state, requestFriendlyDuelCancellation());
        state = reducer(state, cancelFriendlyDuel("user"));
        state = reducer(state, matchFriendlyDuel());

        expect(state).toMatchObject({
            status: "canceled",
            cancellationReason: "user",
            isCanceling: false,
        });
    });

    it("keeps the selected configuration available for another attempt after cancellation", () => {
        let state = createPendingState();
        state = reducer(state, cancelFriendlyDuel("server"));
        state = reducer(state, returnToFriendlyDuelConfiguration());

        expect(state).toMatchObject({
            status: "configuring",
            step: "opponent",
            nickname: "opponent",
            configurationId: 11,
        });
    });

    it("recovers from a cancellation mutation error without keeping the control disabled", () => {
        let state = createPendingState();
        state = reducer(state, requestFriendlyDuelCancellation());
        state = reducer(
            state,
            failFriendlyDuelCancellation({ title: "Не удалось отменить вызов" }),
        );

        expect(state).toMatchObject({
            status: "pending",
            isCanceling: false,
            error: { title: "Не удалось отменить вызов" },
        });
    });

    it("loads configurations only while the configuration scenario is open", () => {
        const idleState = reducer(undefined, { type: "test/init" });
        const configuringState = reducer(idleState, openFriendlyDuel());
        const pendingState = createPendingState();

        expect(isFriendlyDuelConfigurationScenarioActive(idleState)).toBe(false);
        expect(isFriendlyDuelConfigurationScenarioActive(configuringState)).toBe(true);
        expect(isFriendlyDuelConfigurationScenarioActive(pendingState)).toBe(false);
    });
});
