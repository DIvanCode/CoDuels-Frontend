import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishActiveDuel, resetDuelSession } from "../../../model/duelSessionSlice";
import { startInitialSync } from "../initialSync";

const syncMocks = vi.hoisted(() => ({
    getActiveDuelId: vi.fn(),
    getDuel: vi.fn(),
    invalidateTags: vi.fn((payload: unknown) => ({ type: "api/invalidate", payload })),
}));

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getActiveDuelId: {
                initiate: syncMocks.getActiveDuelId,
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

const createState = (activeDuelId: number | null, activeDuelUserId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: {
            phase: activeDuelId === null ? "idle" : "active",
            activeDuelId,
            activeDuelUserId,
            pendingStartedInCurrentRuntime: false,
            pendingResult: null,
        },
    }) as RootState;

describe("initial duel synchronization", () => {
    beforeEach(() => {
        syncMocks.getActiveDuelId.mockReset();
        syncMocks.getDuel.mockReset();
        syncMocks.invalidateTags.mockClear();
    });

    it("verifies an ownerless legacy candidate after a null active ID", async () => {
        const activeAction = { type: "duel/active" };
        const detailAction = { type: "duel/detail" };
        const activeRequest = {
            unwrap: vi.fn().mockResolvedValue({ duel_id: null }),
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
        syncMocks.getActiveDuelId.mockReturnValue(activeAction);
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
        expect(syncMocks.getActiveDuelId).toHaveBeenCalledWith(7, {
            forceRefetch: true,
            subscribe: false,
        });
    });

    it("keeps a user without an active duel idle and does not fetch detail", async () => {
        const activeAction = { type: "duel/active-id" };
        const activeRequest = {
            unwrap: vi.fn().mockResolvedValue({ duel_id: null }),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        syncMocks.getActiveDuelId.mockReturnValue(activeAction);
        const dispatch = vi.fn((action) => (action === activeAction ? activeRequest : action));
        const state = createState(null, null);

        const synchronization = startInitialSync({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => state,
            userId: 7,
        });
        await synchronization.promise;

        expect(syncMocks.getDuel).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalledWith(resetDuelSession());
    });

    it("ignores a late active ID response after switching users", async () => {
        const activeAction = { type: "duel/active-id" };
        let resolveRequest: (value: unknown) => void = () => undefined;
        const activeRequest = {
            unwrap: vi.fn(
                () =>
                    new Promise((resolve) => {
                        resolveRequest = resolve;
                    }),
            ),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        syncMocks.getActiveDuelId.mockReturnValue(activeAction);
        const dispatch = vi.fn((action) => (action === activeAction ? activeRequest : action));
        let state = createState(null, null);

        const synchronization = startInitialSync({
            dispatch: dispatch as unknown as AppDispatch,
            getState: () => state,
            userId: 7,
        });
        state = {
            ...state,
            auth: { user: { id: 8 }, token: "other-token", refreshToken: "other-refresh" },
        } as RootState;
        resolveRequest({ duel_id: 42 });
        await synchronization.promise;

        expect(syncMocks.getDuel).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalledWith(resetDuelSession());
    });

    it("does not reset a newer duel after stale candidate verification fails", async () => {
        const activeAction = { type: "duel/active" };
        const detailAction = { type: "duel/detail" };
        let rejectDetail: (error: unknown) => void = () => undefined;
        const activeRequest = {
            unwrap: vi.fn().mockResolvedValue({ duel_id: null }),
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
        syncMocks.getActiveDuelId.mockReturnValue(activeAction);
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
