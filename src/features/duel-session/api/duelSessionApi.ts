import { duelApiSlice } from "entities/duel";
import { apiSlice, refreshAuthToken } from "shared/api";

import { SSE } from "sse.js";
import {
    setActiveDuelId,
    setPhase,
    setLastEventId,
    clearDuelSession,
} from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";
import { clearCodeForDuel } from "widgets/code-panel/model/codeEditorSlice";

export const duelSessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        subscribeToDuelStates: builder.query<void, void>({
            async queryFn() {
                // We don't actually need to make a network request here
                return { data: undefined };
            },
            keepUnusedDataFor: 0, // no cache
            async onCacheEntryAdded(_, { dispatch, getState, cacheDataLoaded, cacheEntryRemoved }) {
                const state = getState() as RootState;
                const token = state.auth.token;
                if (!token) return;

                const lastEventId = state.duelSession.lastEventId;
                const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

                if (lastEventId) {
                    headers["Last-Event-ID"] = lastEventId;
                }

                let eventSource = new SSE(`${import.meta.env.VITE_BASE_URL}/duels/connect`, {
                    headers,
                });

                try {
                    await cacheDataLoaded;

                    const duelStartedListener = (event: MessageEvent) => {
                        const duelMessage = JSON.parse(event.data) satisfies DuelMessage;

                        dispatch(setActiveDuelId(duelMessage.duel_id));

                        if (event.lastEventId) {
                            dispatch(setLastEventId(event.lastEventId));
                        }

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: duelMessage.duel_id },
                            ]),
                        );
                    };

                    const duelFinishedListener = (event: MessageEvent) => {
                        const duelMessage = JSON.parse(event.data) satisfies DuelMessage;

                        if (event.lastEventId) {
                            dispatch(setLastEventId(event.lastEventId));
                        }

                        dispatch(setPhase("idle"));
                        dispatch(clearDuelSession());
                        dispatch(clearCodeForDuel(String(duelMessage.duel_id)));

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: duelMessage.duel_id },
                            ]),
                        );
                    };

                    const errorListener = async (event: MessageEvent) => {
                        console.warn("SSE error:", event);
                        console.log("Retrying SSE connection...");

                        const newAccessToken = await refreshAuthToken(
                            getState() as RootState,
                            dispatch,
                        );

                        if (newAccessToken) {
                            eventSource.close();

                            const currentState = getState() as RootState;
                            const lastEventId = currentState.duelSession.lastEventId;
                            const reconnectHeaders: Record<string, string> = {
                                Authorization: `Bearer ${newAccessToken}`,
                            };

                            if (lastEventId) {
                                reconnectHeaders["Last-Event-ID"] = lastEventId;
                            }

                            eventSource = new SSE(
                                `${import.meta.env.VITE_BASE_URL}/duels/connect`,
                                {
                                    headers: reconnectHeaders,
                                },
                            );
                            setupListeners();

                            console.log("SSE Connection re-established");
                        }
                    };

                    const setupListeners = () => {
                        eventSource.addEventListener("error", errorListener);
                        eventSource.addEventListener("DuelStarted", duelStartedListener);
                        eventSource.addEventListener("DuelFinished", duelFinishedListener);

                        eventSource.addEventListener("message", (event: MessageEvent) => {
                            if (event.lastEventId) {
                                dispatch(setLastEventId(event.lastEventId));
                            }
                        });
                    };

                    setupListeners();
                } catch {
                    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
                    // in which case `cacheDataLoaded` will throw
                }

                await cacheEntryRemoved;
                eventSource.close();
            },
        }),
    }),
});

export const { useSubscribeToDuelStatesQuery } = duelSessionApiSlice;
