import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { SSE } from "sse.js";
import { setActiveDuelId, setPhase } from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";

export const duelSessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        subscribeToDuelStates: builder.query<void, void>({
            async queryFn() {
                // We don't actually need to make a network request here
                return { data: undefined };
            },
            keepUnusedDataFor: 0, // no cache
            async onCacheEntryAdded(_, { cacheDataLoaded, cacheEntryRemoved, dispatch, getState }) {
                const state = getState() as RootState;
                const token = state.auth.token;

                const eventSource = new SSE(`${import.meta.env.VITE_BASE_URL}/duels/connect`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                try {
                    await cacheDataLoaded;

                    const duelStartedListener = (event: MessageEvent) => {
                        const duelMessage = JSON.parse(event.data) satisfies DuelMessage;

                        dispatch(setActiveDuelId(duelMessage.duel_id));

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: duelMessage.duel_id },
                            ]),
                        );
                    };

                    const duelFinishedListener = (event: MessageEvent) => {
                        const duelMessage = JSON.parse(event.data) satisfies DuelMessage;

                        dispatch(setPhase("idle"));

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: duelMessage.duel_id },
                            ]),
                        );
                    };

                    eventSource.addEventListener("DuelStarted", duelStartedListener);
                    eventSource.addEventListener("DuelFinished", duelFinishedListener);
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
