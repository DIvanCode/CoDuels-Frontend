import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { SSE } from "sse.js";
import { setActiveDuelId, setPhase } from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";

const BASE_URL = "http://localhost/api"; // TODO: полетит в .env

export const duelSessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        subscribeToDuelStates: builder.query<void, void>({
            async queryFn() {
                // We don't actually need to make a network request here
                return { data: undefined };
            },
            keepUnusedDataFor: 0, // no cache
            async onCacheEntryAdded(_, { cacheDataLoaded, cacheEntryRemoved, dispatch, getState }) {
                // TODO: мб не лучшее решение прям тащить весь стейт. Посмотри, мб можно через селекторы
                const state = getState() as RootState;
                const token = state.auth.token;

                const eventSource = new SSE(`${BASE_URL}/duels/connect`, {
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
                            duelApiSlice.util.updateQueryData(
                                "getDuel",
                                duelMessage.duel_id,
                                (draft) => {
                                    draft.status = "in_progress";
                                },
                            ),
                        );
                    };

                    const duelFinishedListener = (event: MessageEvent) => {
                        const duelMessage = JSON.parse(event.data) satisfies DuelMessage;

                        dispatch(setPhase("idle"));

                        dispatch(
                            duelApiSlice.util.updateQueryData(
                                "getDuel",
                                duelMessage.duel_id,
                                (draft) => {
                                    draft.status = "finished";
                                    draft.winner_user_id = duelMessage.winner_user_id;
                                },
                            ),
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
