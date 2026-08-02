import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishActiveDuel, resetDuelSession } from "./duelSessionSlice";
import { restoreDuelSession } from "./thunks";

const queryMocks = vi.hoisted(() => ({
    initiate: vi.fn(),
}));

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getActiveDuel: { matchRejected: () => false },
            getDuel: {
                initiate: queryMocks.initiate,
                matchFulfilled: () => false,
            },
        },
    },
}));

const createState = (activeDuelId: number, activeDuelUserId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: {
            activeDuelId,
            activeDuelUserId,
            pendingResult: null,
        },
    }) as RootState;

describe("restore duel session", () => {
    beforeEach(() => {
        queryMocks.initiate.mockReset();
    });

    it("turns an ownerless legacy finished duel into the current user's pending result", async () => {
        const queryAction = { type: "duel/detail" };
        const request = {
            unwrap: vi.fn().mockResolvedValue({
                id: 42,
                status: "Finished",
                participants: [{ id: 7 }, { id: 8 }],
            }),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        const state = createState(42, null);

        await restoreDuelSession(42)(dispatch as unknown as AppDispatch, () => state, undefined);

        expect(dispatch).toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(request.unsubscribe).toHaveBeenCalledOnce();
    });

    it("does not reset a newer duel when stale detail verification fails", async () => {
        const queryAction = { type: "duel/detail" };
        let rejectRequest: (error: unknown) => void = () => undefined;
        const request = {
            unwrap: vi.fn(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectRequest = reject;
                    }),
            ),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        let state = createState(42, 7);

        const restoration = restoreDuelSession(42)(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );
        await vi.waitFor(() => expect(request.unwrap).toHaveBeenCalledOnce());

        state = createState(43, 7);
        rejectRequest({ status: 404 });
        await restoration;

        expect(dispatch).not.toHaveBeenCalledWith(resetDuelSession());
        expect(request.unsubscribe).toHaveBeenCalledOnce();
    });
});
