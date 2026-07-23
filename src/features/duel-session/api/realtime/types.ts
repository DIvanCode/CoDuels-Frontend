export type RealtimeConnectionStatus = "idle" | "connecting" | "open" | "waiting";

export interface RealtimeConnectionSnapshot {
    status: RealtimeConnectionStatus;
    attempt: number;
    connectedAt: number | null;
    lastMessageAt: number | null;
    retryDelayMs: number | null;
    reason: string | null;
}

export interface DuelIdPayload {
    duel_id: number;
}

export interface InvitationPayload {
    opponent_nickname?: string | null;
    configuration_id?: number | null;
    tournament_id?: number | null;
    group_id?: number | null;
    group_name?: string | null;
}

export interface OpponentSolutionPayload extends DuelIdPayload {
    task_key: string;
    language: string;
    solution: string;
}

export interface SubmissionStatusPayload extends DuelIdPayload {
    submission_id: number;
    status: "Queued" | "Running" | "Done";
    message?: string | null;
    verdict?: string | null;
}

export interface CodeRunStatusPayload {
    run_id: number;
    status: string;
    error?: string | null;
}

type RealtimeEvent<TType extends string, TPayload> = {
    type: TType;
    payload: TPayload;
    eventId: string | null;
};

export type KnownRealtimeEvent =
    | RealtimeEvent<"DuelStarted", DuelIdPayload>
    | RealtimeEvent<"DuelFinished", DuelIdPayload>
    | RealtimeEvent<"DuelCanceled", InvitationPayload>
    | RealtimeEvent<"DuelChanged", DuelIdPayload>
    | RealtimeEvent<"DuelInvitation", InvitationPayload>
    | RealtimeEvent<"DuelInvitationCanceled", InvitationPayload>
    | RealtimeEvent<"DuelInvitationDenied", InvitationPayload>
    | RealtimeEvent<"GroupInvitation", InvitationPayload>
    | RealtimeEvent<"GroupInvitationCanceled", InvitationPayload>
    | RealtimeEvent<"GroupDuelInvitation", InvitationPayload>
    | RealtimeEvent<"GroupDuelInvitationCanceled", InvitationPayload>
    | RealtimeEvent<"TournamentDuelInvitation", InvitationPayload>
    | RealtimeEvent<"TournamentDuelInvitationCanceled", InvitationPayload>
    | RealtimeEvent<"OpponentSolutionUpdated", OpponentSolutionPayload>
    | RealtimeEvent<"SubmissionStatusUpdated", SubmissionStatusPayload>
    | RealtimeEvent<"CodeRunStatusUpdated", CodeRunStatusPayload>;

export type KnownRealtimeEventType = KnownRealtimeEvent["type"];

export type RealtimeEventOf<TType extends KnownRealtimeEventType> = Extract<
    KnownRealtimeEvent,
    { type: TType }
>;

export type RealtimeEventHandler<TType extends KnownRealtimeEventType> = (
    event: RealtimeEventOf<TType>,
) => void;

export type RealtimeEventHandlers = {
    [TType in KnownRealtimeEventType]?: RealtimeEventHandler<TType>[];
};
