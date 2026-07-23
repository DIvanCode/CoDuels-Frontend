import { userApiSlice } from "entities/user";
import { apiSlice } from "shared/api";

import { setPhase, setLastEventId, setSessionInterrupted } from "../model/duelSessionSlice";
import { registerDuelRealtimeSession } from "./realtime/connectionRegistry";
import { createDomainHandlers } from "./realtime/domain/createDomainHandlers";
import { EventRouter } from "./realtime/eventRouter";
import { startInitialSync } from "./realtime/initialSync";
import { DuelRealtimeSession } from "./realtime/session";
import { SolutionPublisher } from "./realtime/solutionPublisher";
import { selectSolutionSnapshot } from "./realtime/solutionSnapshot";
import { RealtimeTransport } from "./realtime/transport";
import { buildUserConnectUrl } from "./realtime/url";

export const duelSessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        startDuelSearch: builder.mutation<void, void>({
            query: () => ({
                url: "/duels/search",
                method: "POST",
            }),
        }),
        cancelDuelSearch: builder.mutation<void, void>({
            query: () => ({
                url: "/duels/cancel",
                method: "POST",
            }),
            invalidatesTags: [
                { type: "DuelInvitation", id: "LIST" },
                { type: "GroupInvitation", id: "LIST" },
                "Tournament",
            ],
        }),
        subscribeToDuelStates: builder.query<void, number>({
            queryFn: () => ({ data: undefined }),
            keepUnusedDataFor: 0,
            async onCacheEntryAdded(
                userId,
                { dispatch, getState, cacheDataLoaded, cacheEntryRemoved },
            ) {
                try {
                    await cacheDataLoaded;
                } catch {
                    return;
                }

                const isCurrentSession = () => {
                    const state = getState() as RootState;
                    return state.auth.user?.id === userId && Boolean(state.auth.token);
                };
                if (!isCurrentSession()) return;

                let initialSync: ReturnType<typeof startInitialSync> | null = null;
                const reconcile = () => {
                    if (!isCurrentSession()) return;
                    initialSync?.abort();
                    const currentSync = startInitialSync({
                        dispatch,
                        getState: getState as () => RootState,
                        userId,
                    });
                    initialSync = currentSync;
                    void currentSync.promise.finally(() => {
                        if (initialSync === currentSync) initialSync = null;
                    });
                };

                const transport = new RealtimeTransport({
                    requestTicket: async (signal) => {
                        const request = dispatch(userApiSlice.endpoints.createTicket.initiate());
                        const abortRequest = () => request.abort();
                        signal.addEventListener("abort", abortRequest, { once: true });

                        try {
                            const response = await request.unwrap();
                            return response.ticket;
                        } finally {
                            signal.removeEventListener("abort", abortRequest);
                            request.reset();
                        }
                    },
                    buildUrl: (ticket) =>
                        buildUserConnectUrl(
                            import.meta.env.VITE_BASE_URL,
                            window.location.origin,
                            ticket,
                        ),
                    subscribeOnline: (listener) => {
                        window.addEventListener("online", listener);
                        return () => window.removeEventListener("online", listener);
                    },
                });

                const domainContext = {
                    dispatch,
                    getState: getState as () => RootState,
                    userId,
                    reconcile,
                };
                const router = new EventRouter({
                    handlers: createDomainHandlers(domainContext),
                    initialEventId: (getState() as RootState).duelSession.lastEventId,
                    onAcceptedEventId: (eventId) => {
                        if (isCurrentSession()) dispatch(setLastEventId(eventId));
                    },
                    onIgnored: (reason, eventName) => {
                        if (reason.startsWith("invalid")) {
                            console.warn("Realtime event ignored", { reason, eventName });
                        }
                    },
                    onHandlerError: (error, event) => {
                        console.error("Realtime event handler failed", event.type, error);
                    },
                });
                const publisher = new SolutionPublisher({
                    getSnapshot: () =>
                        isCurrentSession()
                            ? selectSolutionSnapshot(getState() as RootState, window.location)
                            : null,
                    send: (message) => transport.send(message),
                });
                const session = new DuelRealtimeSession({
                    transport,
                    router,
                    publisher,
                    reconcile,
                    onInterrupted: (interrupted) => {
                        if (isCurrentSession()) dispatch(setSessionInterrupted(interrupted));
                    },
                    onDisconnected: () => {
                        if (!isCurrentSession()) return;
                        if ((getState() as RootState).duelSession.phase === "searching") {
                            dispatch(setPhase("idle"));
                        }
                    },
                    onError: (error) => console.error("Realtime reconciliation failed", error),
                });

                const unregister = registerDuelRealtimeSession(userId, session);
                session.start();

                await cacheEntryRemoved;
                unregister();
                const pendingInitialSync = initialSync as ReturnType<
                    typeof startInitialSync
                > | null;
                pendingInitialSync?.abort();
                session.stop();
            },
        }),
    }),
});

export const {
    useStartDuelSearchMutation,
    useCancelDuelSearchMutation,
    useSubscribeToDuelStatesQuery,
} = duelSessionApiSlice;
