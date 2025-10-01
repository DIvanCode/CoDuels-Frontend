import { duelApiSlice } from "entities/duel";
import { apiSlice } from "shared/api";

import { setActiveDuelId, setPhase } from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";

export const duelSessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        subscribeToDuelStates: builder.query<void, string>({
            async queryFn() {
                // We don't actually need to make a network request here
                return { data: undefined };
            },
            keepUnusedDataFor: 0, // no cache
            async onCacheEntryAdded(userId, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
                const eventSource = new EventSource(`/fakeApi/duels/events?user_id=${userId}`);

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

                    eventSource.addEventListener("duel_started", duelStartedListener);
                    eventSource.addEventListener("duel_finished", duelFinishedListener);
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
