import { duelApiSlice } from "entities/duel";
import { apiSlice, refreshAuthToken } from "shared/api";

import { SSE } from "sse.js";
import { userApiSlice } from "entities/user";
import {
    setActiveDuelId,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setPhase,
    setLastEventId,
    resetDuelSession,
} from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";
import { SSE_RETRY_TIMEOUT } from "../lib/const";

const buildDuelStartUrl = (nickname?: string | null, configurationId?: number | null) => {
    const baseUrl = `${import.meta.env.VITE_BASE_URL}/duels/start`;
    const params = new URLSearchParams();

    if (nickname) {
        params.set("nickname", nickname);
    }

    if (configurationId) {
        params.set("configurationId", String(configurationId));
    }

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
};

// TODO: Надо пересмотреть запросы дуэли и работу с SSE.
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
                const searchNickname = state.duelSession.searchNickname;
                const searchConfigurationId = state.duelSession.searchConfigurationId;
                const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

                if (lastEventId) {
                    headers["Last-Event-ID"] = lastEventId;
                }

                let eventSource = new SSE(
                    buildDuelStartUrl(searchNickname, searchConfigurationId),
                    {
                        headers,
                    },
                );

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
                        dispatch(resetDuelSession());

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: duelMessage.duel_id },
                            ]),
                        );

                        dispatch(userApiSlice.util.invalidateTags([{ type: "User", id: "ME" }]));
                    };

                    const duelCanceledListener = (event: MessageEvent) => {
                        const payload =
                            event.data && typeof event.data === "string"
                                ? (JSON.parse(event.data) as { opponent_nickname?: string | null })
                                : null;

                        if (event.lastEventId) {
                            dispatch(setLastEventId(event.lastEventId));
                        }

                        dispatch(setPhase("idle"));
                        dispatch(resetDuelSession());
                        dispatch(
                            setDuelCanceledOpponentNickname(payload?.opponent_nickname ?? null),
                        );
                        dispatch(setDuelCanceled(true));
                    };

                    const duelChangedListener = (event: MessageEvent) => {
                        const duelMessage =
                            event.data && typeof event.data === "string"
                                ? (JSON.parse(event.data) as DuelMessage)
                                : null;
                        const duelId =
                            duelMessage?.duel_id ??
                            (getState() as RootState).duelSession.activeDuelId;

                        if (event.lastEventId) {
                            dispatch(setLastEventId(event.lastEventId));
                        }

                        if (duelId) {
                            dispatch(
                                duelApiSlice.util.invalidateTags([{ type: "Duel", id: duelId }]),
                            );
                        }
                    };

                    const errorListener = async (event: MessageEvent) => {
                        const sseReconnect = async () => {
                            const state = getState() as RootState;

                            if (state.duelSession.phase === "idle") return;

                            console.warn("SSE error:", event);
                            console.log("Retrying SSE connection...");

                            const newAccessToken = await refreshAuthToken(state, dispatch);

                            if (newAccessToken) {
                                eventSource.close();

                                const currentState = getState() as RootState;
                                const lastEventId = currentState.duelSession.lastEventId;
                                const currentSearchNickname =
                                    currentState.duelSession.searchNickname;
                                const currentSearchConfigurationId =
                                    currentState.duelSession.searchConfigurationId;
                                const reconnectHeaders: Record<string, string> = {
                                    Authorization: `Bearer ${newAccessToken}`,
                                };

                                if (lastEventId) {
                                    reconnectHeaders["Last-Event-ID"] = lastEventId;
                                }

                                eventSource = new SSE(
                                    buildDuelStartUrl(
                                        currentSearchNickname,
                                        currentSearchConfigurationId,
                                    ),
                                    {
                                        headers: reconnectHeaders,
                                    },
                                );
                                setupListeners();
                            }
                        };

                        setTimeout(sseReconnect, SSE_RETRY_TIMEOUT);
                    };

                    const setupListeners = () => {
                        eventSource.addEventListener("error", errorListener);
                        eventSource.addEventListener("DuelStarted", duelStartedListener);
                        eventSource.addEventListener("DuelFinished", duelFinishedListener);
                        eventSource.addEventListener("duel_canceled", duelCanceledListener);
                        eventSource.addEventListener("DuelCanceled", duelCanceledListener);
                        eventSource.addEventListener("duel_changed", duelChangedListener);
                        eventSource.addEventListener("DuelChanged", duelChangedListener);

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
