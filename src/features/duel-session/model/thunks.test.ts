import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishActiveDuel, resetDuelSession, setActiveDuel } from "./duelSessionSlice";
import { restoreActiveDuel, restoreDuelSession } from "./thunks";

const queryMocks = vi.hoisted(() => ({
    initiate: vi.fn(),
}));

vi.mock("entities/duel", () => ({
    duelApiSlice: {
        endpoints: {
            getDuel: {
                initiate: queryMocks.initiate,
                matchFulfilled: () => false,
            },
        },
    },
}));

const createState = (activeDuelId: number | null, activeDuelUserId: number | null) =>
    ({
        auth: { user: { id: 7 }, token: "token", refreshToken: "refresh" },
        duelSession: {
            activeDuelId,
            activeDuelUserId,
            phase: activeDuelId === null ? "idle" : "active",
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

    it("does not restore an active duel from detail after the ID query returned null", async () => {
        const queryAction = { type: "duel/detail" };
        const request = {
            unwrap: vi.fn().mockResolvedValue({
                id: 42,
                status: "InProgress",
                participants: [{ id: 7 }, { id: 8 }],
            }),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        const state = createState(42, 7);

        await restoreDuelSession(42)(dispatch as unknown as AppDispatch, () => state, undefined);

        expect(dispatch).not.toHaveBeenCalledWith(setActiveDuel({ duelId: 42, userId: 7 }));
        expect(dispatch).toHaveBeenCalledWith(resetDuelSession());
    });

    it("does not apply a finished result after its verification is canceled", async () => {
        const queryAction = { type: "duel/detail" };
        let resolveRequest: (value: unknown) => void = () => undefined;
        const request = {
            unwrap: vi.fn(
                () =>
                    new Promise((resolve) => {
                        resolveRequest = resolve;
                    }),
            ),
            unsubscribe: vi.fn(),
            abort: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        const state = createState(42, 7);
        const restoration = restoreDuelSession(42)(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );
        await vi.waitFor(() => expect(request.unwrap).toHaveBeenCalledOnce());

        restoration.abort();
        resolveRequest({ id: 42, status: "Finished", participants: [{ id: 7 }] });
        await restoration;

        expect(request.abort).toHaveBeenCalledOnce();
        expect(dispatch).not.toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(dispatch).not.toHaveBeenCalledWith(resetDuelSession());
    });
});

describe("restore active duel by ID", () => {
    beforeEach(() => queryMocks.initiate.mockReset());

    it("loads detail before accepting the ID as an active duel", async () => {
        const queryAction = { type: "duel/detail" };
        const request = {
            unwrap: vi.fn().mockResolvedValue({
                id: 42,
                status: "InProgress",
                participants: [{ id: 7 }, { id: 8 }],
            }),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        const state = createState(null, null);

        await restoreActiveDuel({ duelId: 42, userId: 7 })(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );

        expect(dispatch).toHaveBeenCalledWith(setActiveDuel({ duelId: 42, userId: 7 }));
        expect(queryMocks.initiate).toHaveBeenCalledWith(42, {
            forceRefetch: true,
            subscribe: false,
        });
    });

    it("turns an active candidate into a finished result when detail is already terminal", async () => {
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
        const state = createState(42, 7);

        await restoreActiveDuel({ duelId: 42, userId: 7 })(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );

        expect(dispatch).toHaveBeenCalledWith(finishActiveDuel({ duelId: 42, userId: 7 }));
        expect(dispatch).not.toHaveBeenCalledWith(setActiveDuel({ duelId: 42, userId: 7 }));
    });

    it("clears a stale candidate when detail is deleted between the two requests", async () => {
        const queryAction = { type: "duel/detail" };
        const request = {
            unwrap: vi.fn().mockRejectedValue({ status: 404 }),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        const state = createState(42, 7);

        await restoreActiveDuel({ duelId: 42, userId: 7 })(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );

        expect(dispatch).toHaveBeenCalledWith(resetDuelSession());
    });

    it("ignores a late detail response after logout and login as another user", async () => {
        const queryAction = { type: "duel/detail" };
        let resolveRequest: (value: unknown) => void = () => undefined;
        const request = {
            unwrap: vi.fn(
                () =>
                    new Promise((resolve) => {
                        resolveRequest = resolve;
                    }),
            ),
            unsubscribe: vi.fn(),
        };
        queryMocks.initiate.mockReturnValue(queryAction);
        const dispatch = vi.fn((action) => (action === queryAction ? request : action));
        let state = createState(null, null);
        const restoration = restoreActiveDuel({ duelId: 42, userId: 7 })(
            dispatch as unknown as AppDispatch,
            () => state,
            undefined,
        );
        await vi.waitFor(() => expect(request.unwrap).toHaveBeenCalledOnce());

        state = {
            ...createState(null, null),
            auth: { user: { id: 8 }, token: "new-token", refreshToken: "new-refresh" },
        } as RootState;
        resolveRequest({ id: 42, status: "InProgress", participants: [{ id: 7 }] });
        await restoration;

        expect(dispatch).not.toHaveBeenCalledWith(setActiveDuel({ duelId: 42, userId: 7 }));
    });
});
