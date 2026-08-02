export type FriendlyDuelStatus =
    | "idle"
    | "configuring"
    | "pending"
    | "matched"
    | "canceled"
    | "error";

export type FriendlyDuelConfigurationStep = "configuration" | "opponent";

export type FriendlyDuelCancellationReason = "user" | "server" | "disconnect";

export interface FriendlyDuelError {
    title: string;
    description?: string;
}

export interface FriendlyDuelState {
    ownerUserId: number | null;
    status: FriendlyDuelStatus;
    step: FriendlyDuelConfigurationStep;
    nickname: string;
    configurationId: number | null;
    usesDefaultConfiguration: boolean;
    isCanceling: boolean;
    cancellationReason: FriendlyDuelCancellationReason | null;
    error: FriendlyDuelError | null;
}
