import type { Duel } from "entities/duel";
import { duelApiSlice } from "entities/duel";
import { duelInvitationApiSlice } from "entities/duel-invitation/api/duelInvitationApi";
import { userApiSlice } from "entities/user";
import { SubmissionStatus } from "features/submit-code";
import { submitCodeApiSlice } from "features/submit-code/api/submitCodeApi";
import { apiSlice } from "shared/api";
import { fromApiLanguage, LANGUAGES, toApiLanguage } from "shared/config";
import { buildDuelTaskKey } from "widgets/code-panel/lib/duelTaskKey";
import { setCode, setLanguage, setOpponentCode } from "widgets/code-panel/model/codeEditorSlice";
import {
    setActiveDuelId,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    setPhase,
    setLastEventId,
    setSessionInterrupted,
    resetDuelSession,
} from "../model/duelSessionSlice";
import { DuelMessage } from "../model/types";
import { WS_RETRY_TIMEOUT } from "../lib/const";

const buildUserConnectUrl = (ticket: string) => {
    const apiBase = new URL(import.meta.env.VITE_BASE_URL, window.location.origin);
    const basePath = apiBase.pathname.replace(/\/$/, "");

    apiBase.pathname = `${basePath}/users/connect`;
    apiBase.search = "";
    apiBase.searchParams.set("ticket", ticket);

    apiBase.protocol = "ws:";

    return apiBase.toString();
};

type DuelSocketEnvelope = {
    event?: string;
    type?: string;
    name?: string;
    data?: unknown;
    payload?: unknown;
    lastEventId?: string;
    last_event_id?: string;
};

const extractEventName = (envelope: DuelSocketEnvelope) =>
    envelope.event ?? envelope.type ?? envelope.name ?? null;

const extractLastEventId = (envelope: DuelSocketEnvelope) =>
    envelope.lastEventId ?? envelope.last_event_id ?? null;

const normalizeEventName = (eventName: string) => eventName.replace(/[^a-zA-Z]/g, "").toLowerCase();

const getDuelIdFromPayload = (payload: unknown, state: RootState) => {
    if (payload && typeof payload === "object") {
        const duelPayload = payload as { duel_id?: number; id?: number };
        return duelPayload.duel_id ?? duelPayload.id ?? state.duelSession.activeDuelId ?? null;
    }

    return state.duelSession.activeDuelId ?? null;
};

const matchInvitationPayload = (
    payload: { opponent_nickname?: string | null; configuration_id?: number | null } | null,
    state: RootState,
) => {
    if (!payload?.opponent_nickname) return false;

    const { searchNickname, searchConfigurationId } = state.duelSession;
    const payloadConfigId = payload.configuration_id ?? null;

    return (
        searchNickname === payload.opponent_nickname &&
        (searchConfigurationId ?? null) === payloadConfigId
    );
};

const getSelectedTaskKey = (duel: Duel | null) => {
    if (!duel) return null;

    const taskKeyFromQuery = new URLSearchParams(window.location.search).get("task") ?? "";

    if (duel.tasks && Object.keys(duel.tasks).length > 0) {
        const keys = Object.keys(duel.tasks).sort((a, b) => a.localeCompare(b));
        return keys.includes(taskKeyFromQuery) ? taskKeyFromQuery : keys[0];
    }

    if (duel.task_id) {
        return "A";
    }

    return null;
};

const getSelectedTaskId = (duel: Duel, taskKey: string | null) => {
    if (!taskKey) return null;

    if (duel.tasks) {
        return duel.tasks[taskKey]?.id ?? null;
    }

    return duel.task_id ?? null;
};

const getTaskIdByKey = (duel: Duel, taskKey: string | null) => {
    if (!taskKey) return null;

    if (duel.tasks) {
        return duel.tasks[taskKey]?.id ?? null;
    }

    if (duel.task_id && taskKey === "A") {
        return duel.task_id;
    }

    return null;
};

const getDuelIdFromArgs = (args: unknown) => {
    if (typeof args === "string") {
        return args;
    }

    if (
        typeof args === "object" &&
        args !== null &&
        "duelId" in args &&
        typeof (args as { duelId?: string }).duelId === "string"
    ) {
        return (args as { duelId: string }).duelId;
    }

    return null;
};

const updateSubmissionCaches = (
    dispatch: AppDispatch,
    state: RootState,
    payload: {
        duel_id?: number;
        submission_id?: number;
        status?: string;
        message?: string | null;
        verdict?: string | null;
    } | null,
) => {
    if (!payload?.duel_id || !payload.submission_id) return;

    const duelId = String(payload.duel_id);
    const submissionId = String(payload.submission_id);
    const incomingIsDone = payload.status === "Done";

    if (!incomingIsDone) {
        const detailEntry = submitCodeApiSlice.endpoints.getSubmissionDetail.select({
            duelId,
            submissionId,
        })(state);
        const detailStatus = detailEntry?.data?.status;

        if (detailStatus === "Done") {
            return;
        }
    }

    dispatch(
        submitCodeApiSlice.util.updateQueryData(
            "getSubmissionDetail",
            { duelId, submissionId },
            (draft) => {
                if (!draft) return;
                if (!incomingIsDone && draft.status === "Done") {
                    return;
                }
                if (payload.status) {
                    draft.status = payload.status as SubmissionStatus;
                }
                if (payload.verdict !== undefined) {
                    draft.verdict = payload.verdict;
                }
                if (payload.message !== undefined) {
                    draft.message = payload.message;
                }
            },
        ),
    );

    const apiState = state[apiSlice.reducerPath];
    if (!apiState || !("queries" in apiState)) return;

    Object.values(apiState.queries).forEach((entry) => {
        if (!entry || typeof entry !== "object") return;
        const entryData = entry as { endpointName?: string; originalArgs?: unknown };
        if (entryData.endpointName !== "getSubmissions") return;

        const duelIdFromArgs = getDuelIdFromArgs(entryData.originalArgs);
        if (!duelIdFromArgs || duelIdFromArgs !== duelId) return;

        const originalArgs = entryData.originalArgs;
        if (!originalArgs) return;
        let listHasDoneStatus = false;
        if (!incomingIsDone) {
            const listEntry = submitCodeApiSlice.endpoints.getSubmissions.select(
                entryData.originalArgs as string | { duelId: string; taskKey?: string | null },
            )(state);
            const submission = listEntry?.data?.find(
                (item) => String(item.submission_id) === submissionId,
            );
            listHasDoneStatus = submission?.status === "Done";
        }

        if (listHasDoneStatus) return;

        dispatch(
            submitCodeApiSlice.util.updateQueryData(
                "getSubmissions",
                originalArgs as string | { duelId: string; taskKey?: string | null },
                (draft) => {
                    const submissionIndex = draft.findIndex(
                        (item) => String(item.submission_id) === submissionId,
                    );
                    if (submissionIndex === -1) return;
                    if (!incomingIsDone && draft[submissionIndex].status === "Done") {
                        return;
                    }

                    if (payload.status) {
                        draft[submissionIndex].status = payload.status as SubmissionStatus;
                    }
                    if (payload.verdict !== undefined) {
                        draft[submissionIndex].verdict = payload.verdict;
                    }
                },
            ),
        );
    });
};

const getLanguageValue = (language?: string | null) => fromApiLanguage(language);

// TODO: ���� ������������ ������� ����� � ������ � WebSocket.
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
                url: "/duels/search/cancel",
                method: "POST",
            }),
        }),
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

                let socket: WebSocket | null = null;
                let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
                let codeSyncIntervalId: ReturnType<typeof setInterval> | null = null;
                let lastSentCode: { taskKey: string; code: string; language: string } | null = null;

                const requestTicket = async () => {
                    const ticketRequest = dispatch(userApiSlice.endpoints.createTicket.initiate());

                    try {
                        const response = await ticketRequest.unwrap();
                        return response.ticket;
                    } catch (error) {
                        console.error("Ticket request error:", error);
                        return null;
                    }
                };

                try {
                    await cacheDataLoaded;

                    const duelStartedListener = (
                        payload: DuelMessage | null,
                        lastEventId: string | null,
                    ) => {
                        if (!payload) return;

                        dispatch(setActiveDuelId(payload.duel_id));

                        if (lastEventId) {
                            dispatch(setLastEventId(lastEventId));
                        }

                        dispatch(
                            duelApiSlice.util.invalidateTags([
                                { type: "Duel", id: payload.duel_id },
                            ]),
                        );
                    };

                    const duelFinishedListener = (
                        payload: DuelMessage | null,
                        lastEventId: string | null,
                    ) => {
                        if (!payload) return;

                        if (lastEventId) {
                            dispatch(setLastEventId(lastEventId));
                        }

                        const duelId =
                            payload.duel_id ??
                            (getState() as RootState).duelSession.activeDuelId ??
                            null;

                        dispatch(setPhase("idle"));
                        dispatch(resetDuelSession());

                        if (duelId) {
                            dispatch(
                                duelApiSlice.util.invalidateTags([{ type: "Duel", id: duelId }]),
                            );
                        }

                        dispatch(userApiSlice.util.invalidateTags([{ type: "User", id: "ME" }]));
                    };

                    const duelCanceledListener = (
                        payload: { opponent_nickname?: string | null } | null,
                        lastEventId: string | null,
                    ) => {
                        if (lastEventId) {
                            dispatch(setLastEventId(lastEventId));
                        }

                        dispatch(setPhase("idle"));
                        dispatch(resetDuelSession());
                        dispatch(
                            setDuelCanceledOpponentNickname(payload?.opponent_nickname ?? null),
                        );
                        dispatch(setDuelCanceled(true));
                    };

                    const duelChangedListener = (
                        payload: DuelMessage | null,
                        lastEventId: string | null,
                    ) => {
                        const duelId = getDuelIdFromPayload(payload, getState() as RootState);

                        if (lastEventId) {
                            dispatch(setLastEventId(lastEventId));
                        }

                        if (duelId) {
                            dispatch(
                                duelApiSlice.util.invalidateTags([{ type: "Duel", id: duelId }]),
                            );
                        }
                    };

                    const closeSocket = () => {
                        const activeSocket: WebSocket | null = socket;

                        if (!activeSocket) return;

                        activeSocket.onopen = null;
                        activeSocket.onmessage = null;
                        activeSocket.onerror = null;
                        activeSocket.onclose = null;
                        activeSocket.close();
                        socket = null;
                        lastSentCode = null;
                    };

                    const clearReconnectTimeout = () => {
                        if (!reconnectTimeoutId) return;
                        clearTimeout(reconnectTimeoutId);
                        reconnectTimeoutId = null;
                    };

                    const scheduleReconnect = () => {
                        clearReconnectTimeout();
                        reconnectTimeoutId = setTimeout(() => {
                            void connectWebSocket();
                        }, WS_RETRY_TIMEOUT);
                    };

                    const handleMessage = (event: MessageEvent) => {
                        if (typeof event.data !== "string") return;

                        let parsed: DuelSocketEnvelope | null = null;

                        try {
                            parsed = JSON.parse(event.data) as DuelSocketEnvelope;
                        } catch (error) {
                            console.warn("WebSocket message parse error:", error);
                            return;
                        }

                        const eventName = extractEventName(parsed);
                        const lastEventId = extractLastEventId(parsed);
                        const rawPayload =
                            parsed.data ?? parsed.payload ?? (parsed as unknown as DuelMessage);
                        let payload: unknown = rawPayload;

                        if (typeof rawPayload === "string") {
                            try {
                                payload = JSON.parse(rawPayload) as unknown;
                            } catch (error) {
                                console.warn("WebSocket payload parse error:", error);
                                payload = null;
                            }
                        }

                        if (lastEventId) {
                            dispatch(setLastEventId(lastEventId));
                        }

                        if (!eventName) {
                            if (payload && typeof payload === "object" && "duel_id" in payload) {
                                duelChangedListener(payload as DuelMessage, lastEventId);
                            }
                            return;
                        }

                        const normalized = normalizeEventName(eventName);

                        if (normalized === "duelstarted") {
                            duelStartedListener(payload as DuelMessage, lastEventId);
                            return;
                        }

                        if (normalized === "duelfinished") {
                            duelFinishedListener(payload as DuelMessage, lastEventId);
                            return;
                        }

                        if (normalized === "duelcanceled") {
                            duelCanceledListener(
                                payload as { opponent_nickname?: string | null },
                                lastEventId,
                            );
                            return;
                        }

                        if (normalized === "duelinvitation") {
                            dispatch(
                                duelInvitationApiSlice.util.invalidateTags([
                                    { type: "DuelInvitation", id: "LIST" },
                                ]),
                            );
                            return;
                        }

                        if (normalized === "duelinvitationcanceled") {
                            dispatch(
                                duelInvitationApiSlice.util.invalidateTags([
                                    { type: "DuelInvitation", id: "LIST" },
                                ]),
                            );

                            const currentState = getState() as RootState;
                            const invitationPayload = payload as {
                                opponent_nickname?: string | null;
                                configuration_id?: number | null;
                            } | null;

                            if (matchInvitationPayload(invitationPayload, currentState)) {
                                dispatch(setPhase("idle"));
                            }
                            return;
                        }

                        if (normalized === "duelinvitationdenied") {
                            dispatch(
                                duelInvitationApiSlice.util.invalidateTags([
                                    { type: "DuelInvitation", id: "LIST" },
                                ]),
                            );

                            const currentState = getState() as RootState;
                            const invitationPayload = payload as {
                                opponent_nickname?: string | null;
                                configuration_id?: number | null;
                            } | null;

                            if (matchInvitationPayload(invitationPayload, currentState)) {
                                dispatch(setPhase("idle"));
                                dispatch(
                                    setDuelCanceledOpponentNickname(
                                        invitationPayload?.opponent_nickname ?? null,
                                    ),
                                );
                                dispatch(setDuelCanceled(true));
                            }
                            return;
                        }

                        if (normalized === "duelsearchcanceled") {
                            const currentState = getState() as RootState;

                            if (
                                currentState.duelSession.phase === "searching" &&
                                !currentState.duelSession.searchNickname &&
                                !currentState.duelSession.searchConfigurationId
                            ) {
                                dispatch(setPhase("idle"));
                            }
                            return;
                        }

                        if (normalized === "opponentsolutionupdated") {
                            const codePayload = payload as {
                                duel_id?: number;
                                task_key?: string;
                                language?: string;
                                code?: string;
                                solution?: string;
                            } | null;

                            if (!codePayload?.duel_id || !codePayload.task_key) return;

                            const currentState = getState() as RootState;
                            const duelEntry = duelApiSlice.endpoints.getDuel.select(
                                codePayload.duel_id,
                            )(currentState);
                            const duel = duelEntry?.data ?? null;

                            if (!duel?.should_show_opponent_solution) return;

                            const taskId = getTaskIdByKey(duel, codePayload.task_key);

                            if (!taskId) return;

                            dispatch(
                                setOpponentCode({
                                    taskKey: buildDuelTaskKey(codePayload.duel_id, taskId),
                                    code: codePayload.solution ?? "",
                                    language: getLanguageValue(codePayload.language),
                                }),
                            );
                            return;
                        }

                        if (normalized === "duelchanged") {
                            const duelPayload = payload as Duel | null;
                            const currentState = getState() as RootState;
                            const duelId = getDuelIdFromPayload(payload, currentState);

                            if (duelId) {
                                if (duelPayload?.id) {
                                    const mapSolutionToTaskId = (
                                        solutions:
                                            | Record<
                                                  string,
                                                  {
                                                      solution?: string | null;
                                                      code?: string | null;
                                                      language: string;
                                                  }
                                              >
                                            | null
                                            | undefined,
                                        apply: (
                                            taskId: string,
                                            code: string,
                                            language: string,
                                        ) => void,
                                    ) => {
                                        if (!solutions) return;

                                        Object.entries(solutions).forEach(([key, value]) => {
                                            const taskId = getTaskIdByKey(duelPayload, key);

                                            if (!taskId) return;

                                            const solution = value.solution ?? value.code ?? "";
                                            apply(taskId, solution, value.language);
                                        });
                                    };

                                    mapSolutionToTaskId(
                                        duelPayload.solutions,
                                        (taskId, code, language) => {
                                            const taskKey = buildDuelTaskKey(
                                                duelPayload.id,
                                                taskId,
                                            );

                                            dispatch(setCode({ taskKey, code }));
                                            dispatch(
                                                setLanguage({
                                                    taskKey,
                                                    language: getLanguageValue(language),
                                                }),
                                            );
                                        },
                                    );

                                    if (duelPayload.should_show_opponent_solution) {
                                        mapSolutionToTaskId(
                                            duelPayload.opponent_solutions,
                                            (taskId, code, language) => {
                                                dispatch(
                                                    setOpponentCode({
                                                        taskKey: buildDuelTaskKey(
                                                            duelPayload.id,
                                                            taskId,
                                                        ),
                                                        code,
                                                        language: getLanguageValue(language),
                                                    }),
                                                );
                                            },
                                        );
                                    }
                                }
                            }

                            duelChangedListener(payload as DuelMessage, lastEventId);
                            return;
                        }

                        if (normalized === "submissionstatusupdated") {
                            updateSubmissionCaches(
                                dispatch,
                                getState() as RootState,
                                payload as {
                                    duel_id?: number;
                                    submission_id?: number;
                                    status?: string;
                                    message?: string | null;
                                    verdict?: string | null;
                                },
                            );
                            return;
                        }
                    };

                    const connectWebSocket = async () => {
                        const ticket = await requestTicket();

                        if (!ticket) {
                            scheduleReconnect();
                            return;
                        }

                        const wsUrl = buildUserConnectUrl(ticket);

                        closeSocket();
                        lastSentCode = null;

                        try {
                            socket = new WebSocket(wsUrl);
                        } catch (error) {
                            console.error("WebSocket connection error:", error);
                            scheduleReconnect();
                            return;
                        }

                        socket.onopen = () => {
                            clearReconnectTimeout();
                            dispatch(setSessionInterrupted(false));
                            dispatch(
                                apiSlice.util.invalidateTags([
                                    { type: "Duel", id: "LIST" },
                                    { type: "DuelConfiguration", id: "LIST" },
                                    { type: "DuelInvitation", id: "LIST" },
                                    { type: "Submission", id: "LIST" },
                                    { type: "User", id: "ME" },
                                ]),
                            );
                        };

                        socket.onmessage = handleMessage;

                        socket.onerror = (error) => {
                            console.warn("WebSocket error:", error);
                        };

                        socket.onclose = () => {
                            const latestState = getState() as RootState;

                            if (latestState.duelSession.phase === "searching") {
                                dispatch(setPhase("idle"));
                            }

                            if (!latestState.auth.token) return;
                            dispatch(setSessionInterrupted(true));
                        };
                    };

                    void connectWebSocket();

                    codeSyncIntervalId = setInterval(() => {
                        const currentState = getState() as RootState;

                        if (currentState.duelSession.phase !== "active") return;

                        const duelId = currentState.duelSession.activeDuelId;
                        if (!duelId) return;

                        const duelEntry =
                            duelApiSlice.endpoints.getDuel.select(duelId)(currentState);
                        const duel = duelEntry?.data ?? null;

                        if (!duel?.should_show_opponent_solution) return;

                        const selectedTaskKey = getSelectedTaskKey(duel);
                        const selectedTaskId = getSelectedTaskId(duel, selectedTaskKey);

                        if (!selectedTaskKey || !selectedTaskId) return;

                        const editorKey = buildDuelTaskKey(duelId, selectedTaskId);
                        const code = currentState.codeEditor.codeByTaskKey[editorKey] ?? "";
                        const language =
                            currentState.codeEditor.languageByTaskKey[editorKey] ?? LANGUAGES.CPP;
                        const apiLanguage = toApiLanguage(language);

                        if (!socket || socket.readyState !== WebSocket.OPEN) return;

                        if (
                            lastSentCode &&
                            lastSentCode.taskKey === selectedTaskKey &&
                            lastSentCode.code === code &&
                            lastSentCode.language === apiLanguage
                        ) {
                            return;
                        }
                        socket.send(
                            JSON.stringify({
                                type: "SolutionUpdated",
                                duel_id: duelId,
                                task_key: selectedTaskKey,
                                language: apiLanguage,
                                solution: code,
                            }),
                        );

                        lastSentCode = {
                            taskKey: selectedTaskKey,
                            code,
                            language: apiLanguage,
                        };
                    }, 1000);
                } catch {
                    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
                    // in which case `cacheDataLoaded` will throw
                }

                await cacheEntryRemoved;
                if (codeSyncIntervalId) {
                    clearInterval(codeSyncIntervalId);
                    codeSyncIntervalId = null;
                }
                if (reconnectTimeoutId) {
                    clearTimeout(reconnectTimeoutId);
                    reconnectTimeoutId = null;
                }
                if (socket) {
                    const activeSocket: WebSocket = socket;
                    activeSocket.close();
                    socket = null;
                }
            },
        }),
    }),
});

export const {
    useStartDuelSearchMutation,
    useCancelDuelSearchMutation,
    useSubscribeToDuelStatesQuery,
} = duelSessionApiSlice;
