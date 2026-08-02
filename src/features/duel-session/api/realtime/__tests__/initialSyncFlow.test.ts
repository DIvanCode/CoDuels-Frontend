import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishActiveDuel, resetDuelSession } from "../../../model/duelSessionSlice";
import { startInitialSync } from "../initialSync";

const syncMocks = vi.hoisted(() => ({
    getActiveDuel: vi.fn(),
    getDuel: vi.fn(),
    invalidateTags: vi.fn((payload: unknown) => ({ type: "api/invalidate", payload })),
}));

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getActiveDuel: {
                initiate: syncMocks.getActiveDuel,
                matchRejected: () => false,
            },
            getDuel: {
                initiate: syncMocks.getDuel,
                matchFulfilled: () => false,
            },
        },
    },
}));

vi.mock("shared/api", () => ({
    apiSlice: { util: { invalidateTags: syncMocks.invalidateTags } },
}));

const createState = (activeDuelId: number, activeDuelUserId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: {
            phase: "active",
            activeDuelId,
            activeDuelUserId,
            pendingStartedInCurrentRuntime: false,
            pendingResult: null,
        },
    }) as RootState;

describe("initial duel synchronization", () => {
    beforeEach(() => {
        syncMocks.getActiveDuel.mockReset();
        syncMocks.getDuel.mockReset();
        syncMocks.invalidateTags.mockClear();
    });

    it("verifies an ownerless legacy candidate after active-duel 404", async () => {
        const activeAction = { type: "duel/active" };
        const detailAction = { type: "duel/detail" };
        const activeRequest = {
            unwrap: vi.fn().mockRejectedValue({ status: 404 }),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        const detailRequest = {
            unwrap: vi.fn().mockResolvedValue({
                id: 42,
                status: "Finished",
                participants: [{ id: 7 }, { id: 8 }],
            }),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        syncMocks.getActiveDuel.mockReturnValue(activeAction);
        syncMocks.getDuel.mockReturnValue(detailAction);
        const dispatch = vi.fn((action) => {
            if (action === activeAction) return activeRequest;
            if (action === detailAction) return detailRequest;
            return action;
        });
        const state = createState(42, null);

        const synchronization = startInitialSync({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => state,
            userId: 7,
        });
        await synchronization.promise;

        expect(dispatch).toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
    });

    it("does not reset a newer duel after stale candidate verification fails", async () => {
        const activeAction = { type: "duel/active" };
        const detailAction = { type: "duel/detail" };
        let rejectDetail: (error: unknown) => void = () => undefined;
        const activeRequest = {
            unwrap: vi.fn().mockRejectedValue({ status: 404 }),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        const detailRequest = {
            unwrap: vi.fn(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectDetail = reject;
                    }),
            ),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        syncMocks.getActiveDuel.mockReturnValue(activeAction);
        syncMocks.getDuel.mockReturnValue(detailAction);
        const dispatch = vi.fn((action) => {
            if (action === activeAction) return activeRequest;
            if (action === detailAction) return detailRequest;
            return action;
        });
        let state = createState(42, 7);

        const synchronization = startInitialSync({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => state,
            userId: 7,
        });
        await vi.waitFor(() => expect(detailRequest.unwrap).toHaveBeenCalledOnce());

        state = createState(43, 7);
        rejectDetail({ status: 404 });
        await synchronization.promise;

        expect(dispatch).not.toHaveBeenCalledWith(resetDuelSession());
    });
});
