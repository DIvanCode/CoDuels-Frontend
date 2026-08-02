import { describe, expect, it, vi } from "vitest";

import { finishActiveDuel } from "../../../model/duelSessionSlice";
import { createDuelHandlers } from "../domain/duelHandlers";

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: { getDuel: { select: () => () => ({ data: undefined }) } },
        util: { invalidateTags: (payload: unknown) => ({ type: "duel/invalidate", payload }) },
    },
}));
vi.mock("entities/user", () => ({
    userApiSlice: {
        util: { invalidateTags: (payload: unknown) => ({ type: "user/invalidate", payload }) },
    },
}));
vi.mock("entities/submission", () => ({
    submitCodeApiSlice: {
        util: {
            invalidateTags: (payload: unknown) => ({ type: "submission/invalidate", payload }),
        },
    },
}));
vi.mock("shared/config", () => ({ fromApiLanguage: (language: string) => language }));
vi.mock("../../../model/duelSessionSlice", () => {
    const action = (type: string) => (payload?: unknown) => ({ type, payload });
    return {
        finishActiveDuel: action("duelSession/finishActiveDuel"),
        clearDuelStartFence: action("duelSession/clearDuelStartFence"),
        resetDuelSession: action("duelSession/resetDuelSession"),
        setActiveDuel: action("duelSession/setActiveDuel"),
        setDuelCanceled: action("duelSession/setDuelCanceled"),
        setDuelCanceledOpponentNickname: action("duelSession/setDuelCanceledOpponentNickname"),
    };
});

const createState = (
    activeDuelId: number | null,
    phase: "idle" | "searching" | "active" = "active",
    duelStartFenceExpiresAt: number | null = null,
) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: { activeDuelId, phase, duelStartFenceExpiresAt },
    }) as RootState;

describe("duel realtime handlers", () => {
    it("accepts a start event received by an idle sibling tab", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(null, "idle"),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelStarted?.[0]({
            type: "DuelStarted",
            payload: { duel_id: 42 },
            eventId: null,
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: "duelSession/setActiveDuel",
            payload: { duelId: 42, userId: 7 },
        });
    });

    it("ignores a late start event after a pending search was canceled", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(null, "idle", Date.now() + 5_000),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelStarted?.[0]({
            type: "DuelStarted",
            payload: { duel_id: 42 },
            eventId: null,
        });

        expect(dispatch).not.toHaveBeenCalledWith({
            type: "duelSession/setActiveDuel",
            payload: { duelId: 42, userId: 7 },
        });
    });

    it("accepts an idle start after the cancellation fence expires", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(null, "idle", Date.now() - 1),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelStarted?.[0]({
            type: "DuelStarted",
            payload: { duel_id: 42 },
            eventId: null,
        });

        expect(dispatch).toHaveBeenCalledWith({ type: "duelSession/clearDuelStartFence" });
        expect(dispatch).toHaveBeenCalledWith({
            type: "duelSession/setActiveDuel",
            payload: { duelId: 42, userId: 7 },
        });
    });

    it("fences a late start after a server cancellation", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () =>
                ({
                    ...createState(null, "searching"),
                    duelSession: {
                        ...createState(null, "searching").duelSession,
                        searchInvitationType: "Friendly",
                    },
                }) as RootState,
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelCanceled?.[0]({
            type: "DuelCanceled",
            payload: { opponent_nickname: "opponent" },
            eventId: null,
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: "duelSession/resetDuelSession",
            payload: { fenceDuelStart: true },
        });
    });

    it("turns a terminal event for the active duel into a pending result", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(42),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelFinished?.[0]({
            type: "DuelFinished",
            payload: { duel_id: 42 },
            eventId: "9",
        });

        expect(dispatch).toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(dispatch).toHaveBeenCalledWith({
            type: "submission/invalidate",
            payload: ["Submission"],
        });
    });

    it("refreshes submission projections when an accepted solution changes the duel", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(42),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelChanged?.[0]({
            type: "DuelChanged",
            payload: { duel_id: 42 },
            eventId: null,
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: "submission/invalidate",
            payload: ["Submission"],
        });
    });

    it("does not queue a result when a historical duel finishes", () => {
        const dispatch = vi.fn();
        const handlers = createDuelHandlers({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => createState(43),
            userId: 7,
            reconcile: vi.fn(),
        });

        handlers.DuelFinished?.[0]({
            type: "DuelFinished",
            payload: { duel_id: 42 },
            eventId: "9",
        });

        expect(dispatch).not.toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
    });
});
