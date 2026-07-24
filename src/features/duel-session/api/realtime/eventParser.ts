import type {
    CodeRunStatusPayload,
    DuelIdPayload,
    InvitationPayload,
    KnownRealtimeEvent,
    KnownRealtimeEventType,
    OpponentSolutionPayload,
    SubmissionStatusPayload,
} from "./types";

type JsonRecord = Record<string, unknown>;

export type ParsedRealtimeMessage =
    | { kind: "known"; event: KnownRealtimeEvent }
    | { kind: "unknown"; eventName: string | null }
    | { kind: "invalid"; eventName: string | null; reason: string };

const asRecord = (value: unknown): JsonRecord | null =>
    typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as JsonRecord)
        : null;

const parseJsonValue = (value: unknown) => {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value) as unknown;
    } catch {
        return null;
    }
};

const readEventId = (record: JsonRecord) => {
    const value = record.lastEventId ?? record.last_event_id;
    return typeof value === "string" && value.length > 0 ? value : null;
};

const readEventName = (record: JsonRecord) => {
    const value = record.event ?? record.type ?? record.name;
    return typeof value === "string" && value.length > 0 ? value : null;
};

const normalizeEventName = (eventName: string) => eventName.replace(/[^a-zA-Z]/g, "").toLowerCase();

const isOptionalNullableString = (record: JsonRecord, key: string) =>
    !(key in record) || record[key] === null || typeof record[key] === "string";

const isOptionalNullableNumber = (record: JsonRecord, key: string) =>
    !(key in record) || record[key] === null || typeof record[key] === "number";

const parseDuelId = (payload: JsonRecord): DuelIdPayload | null => {
    const duelId = payload.duel_id ?? payload.id;
    return typeof duelId === "number" && Number.isFinite(duelId) ? { duel_id: duelId } : null;
};

const parseInvitation = (payload: JsonRecord): InvitationPayload | null => {
    if (!isOptionalNullableString(payload, "opponent_nickname")) return null;
    if (!isOptionalNullableNumber(payload, "configuration_id")) return null;
    if (!isOptionalNullableNumber(payload, "tournament_id")) return null;
    if (!isOptionalNullableNumber(payload, "group_id")) return null;
    if (!isOptionalNullableString(payload, "group_name")) return null;

    return {
        opponent_nickname: payload.opponent_nickname as string | null | undefined,
        configuration_id: payload.configuration_id as number | null | undefined,
        tournament_id: payload.tournament_id as number | null | undefined,
        group_id: payload.group_id as number | null | undefined,
        group_name: payload.group_name as string | null | undefined,
    };
};

const parseOpponentSolution = (payload: JsonRecord): OpponentSolutionPayload | null => {
    const duel = parseDuelId(payload);
    const solution = payload.solution ?? payload.code;
    if (!duel || typeof payload.task_key !== "string" || payload.task_key.length === 0) {
        return null;
    }
    if (typeof payload.language !== "string" || typeof solution !== "string") return null;

    return {
        ...duel,
        task_key: payload.task_key,
        language: payload.language,
        solution,
    };
};

const parseSubmissionStatus = (payload: JsonRecord): SubmissionStatusPayload | null => {
    const duel = parseDuelId(payload);
    const validStatus =
        payload.status === "Queued" || payload.status === "Running" || payload.status === "Done";

    if (!duel || typeof payload.submission_id !== "number" || !validStatus) return null;
    if (!isOptionalNullableString(payload, "message")) return null;
    if (!isOptionalNullableString(payload, "verdict")) return null;

    return {
        ...duel,
        submission_id: payload.submission_id,
        status: payload.status as SubmissionStatusPayload["status"],
        message: payload.message as string | null | undefined,
        verdict: payload.verdict as string | null | undefined,
    };
};

const parseCodeRunStatus = (payload: JsonRecord): CodeRunStatusPayload | null => {
    if (typeof payload.run_id !== "number" || typeof payload.status !== "string") return null;
    if (!isOptionalNullableString(payload, "error")) return null;

    return {
        run_id: payload.run_id,
        status: payload.status,
        error: payload.error as string | null | undefined,
    };
};

const eventTypeByNormalizedName: Record<string, KnownRealtimeEventType> = {
    duelstarted: "DuelStarted",
    duelfinished: "DuelFinished",
    duelcanceled: "DuelCanceled",
    duelchanged: "DuelChanged",
    duelinvitation: "DuelInvitation",
    duelinvitationcanceled: "DuelInvitationCanceled",
    duelinvitationdenied: "DuelInvitationDenied",
    groupinvitation: "GroupInvitation",
    groupinvitationcanceled: "GroupInvitationCanceled",
    groupduelinvitation: "GroupDuelInvitation",
    groupduelinvitationcanceled: "GroupDuelInvitationCanceled",
    tournamentduelinvitation: "TournamentDuelInvitation",
    tournamentinvitation: "TournamentDuelInvitation",
    tournamentduelinvitationcanceled: "TournamentDuelInvitationCanceled",
    tournamentinvitationcanceled: "TournamentDuelInvitationCanceled",
    opponentsolutionupdated: "OpponentSolutionUpdated",
    submissionstatusupdated: "SubmissionStatusUpdated",
    coderunstatusupdated: "CodeRunStatusUpdated",
};

const buildKnownEvent = (
    type: KnownRealtimeEventType,
    payload: JsonRecord,
    eventId: string | null,
): KnownRealtimeEvent | null => {
    switch (type) {
        case "DuelStarted":
        case "DuelFinished":
        case "DuelChanged": {
            const parsed = parseDuelId(payload);
            return parsed ? { type, payload: parsed, eventId } : null;
        }
        case "DuelCanceled": {
            const parsed = parseInvitation(payload);
            return parsed ? { type, payload: parsed, eventId } : null;
        }
        case "DuelInvitation":
        case "DuelInvitationCanceled":
        case "DuelInvitationDenied":
        case "GroupDuelInvitation":
        case "GroupDuelInvitationCanceled": {
            const parsed = parseInvitation(payload);
            return parsed && typeof parsed.opponent_nickname === "string"
                ? { type, payload: parsed, eventId }
                : null;
        }
        case "GroupInvitation":
        case "GroupInvitationCanceled": {
            const parsed = parseInvitation(payload);
            return parsed && typeof parsed.group_id === "number"
                ? { type, payload: parsed, eventId }
                : null;
        }
        case "TournamentDuelInvitation": {
            const parsed = parseInvitation(payload);
            return parsed &&
                typeof parsed.tournament_id === "number" &&
                typeof parsed.opponent_nickname === "string"
                ? { type, payload: parsed, eventId }
                : null;
        }
        case "TournamentDuelInvitationCanceled": {
            const parsed = parseInvitation(payload);
            return parsed && typeof parsed.tournament_id === "number"
                ? { type, payload: parsed, eventId }
                : null;
        }
        case "OpponentSolutionUpdated": {
            const parsed = parseOpponentSolution(payload);
            return parsed ? { type, payload: parsed, eventId } : null;
        }
        case "SubmissionStatusUpdated": {
            const parsed = parseSubmissionStatus(payload);
            return parsed ? { type, payload: parsed, eventId } : null;
        }
        case "CodeRunStatusUpdated": {
            const parsed = parseCodeRunStatus(payload);
            return parsed ? { type, payload: parsed, eventId } : null;
        }
    }
};

export const parseRealtimeMessage = (rawMessage: string): ParsedRealtimeMessage => {
    let parsedMessage: unknown;
    try {
        parsedMessage = JSON.parse(rawMessage) as unknown;
    } catch {
        return { kind: "invalid", eventName: null, reason: "invalid-json" };
    }

    const envelope = asRecord(parsedMessage);
    if (!envelope) {
        return { kind: "invalid", eventName: null, reason: "invalid-envelope" };
    }

    const eventName = readEventName(envelope);
    const eventId = readEventId(envelope);
    const nestedPayload = "data" in envelope ? envelope.data : envelope.payload;
    const payloadValue = nestedPayload === undefined ? envelope : parseJsonValue(nestedPayload);
    const payload = asRecord(payloadValue);

    if (!payload) {
        return { kind: "invalid", eventName, reason: "invalid-payload" };
    }

    if (!eventName) {
        const legacyDuelChanged = parseDuelId(payload);
        return legacyDuelChanged
            ? {
                  kind: "known",
                  event: { type: "DuelChanged", payload: legacyDuelChanged, eventId },
              }
            : { kind: "unknown", eventName: null };
    }

    const type = eventTypeByNormalizedName[normalizeEventName(eventName)];
    if (!type) return { kind: "unknown", eventName };

    const event = buildKnownEvent(type, payload, eventId);
    return event
        ? { kind: "known", event }
        : { kind: "invalid", eventName, reason: "invalid-known-event-payload" };
};
