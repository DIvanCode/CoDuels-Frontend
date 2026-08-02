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
vi.mock("shared/config", () => ({ fromApiLanguage: (language: string) => language }));
vi.mock("../../../model/duelSessionSlice", () => {
    const action = (type: string) => (payload?: unknown) => ({ type, payload });
    return {
        finishActiveDuel: action("duelSession/finishActiveDuel"),
        resetDuelSession: action("duelSession/resetDuelSession"),
        setActiveDuel: action("duelSession/setActiveDuel"),
        setDuelCanceled: action("duelSession/setDuelCanceled"),
        setDuelCanceledOpponentNickname: action("duelSession/setDuelCanceledOpponentNickname"),
    };
});

const createState = (activeDuelId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: { activeDuelId },
    }) as RootState;

describe("duel realtime handlers", () => {
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
