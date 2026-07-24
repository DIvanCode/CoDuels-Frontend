import type { RealtimeConnectionSnapshot } from "./types";

interface WebSocketLike {
    readyState: number;
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    send(data: string): void;
    close(): void;
}

interface TimerScheduler {
    setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
    clearTimeout(id: ReturnType<typeof setTimeout>): void;
    setInterval(callback: () => void, delayMs: number): ReturnType<typeof setInterval>;
    clearInterval(id: ReturnType<typeof setInterval>): void;
}

interface RealtimeTransportOptions {
    requestTicket: (signal: AbortSignal) => Promise<string>;
    buildUrl: (ticket: string) => string;
    createSocket?: (url: string) => WebSocketLike;
    subscribeOnline?: (listener: () => void) => () => void;
    scheduler?: TimerScheduler;
    now?: () => number;
    random?: () => number;
    baseRetryDelayMs?: number;
    maxRetryDelayMs?: number;
    retryJitterRatio?: number;
    connectionTimeoutMs?: number;
    healthCheckIntervalMs?: number;
}

type MessageListener = (data: string) => void;
type StateListener = (snapshot: RealtimeConnectionSnapshot) => void;

const defaultScheduler: TimerScheduler = {
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (callback, delayMs) => setInterval(callback, delayMs),
    clearInterval: (id) => clearInterval(id),
};

const OPEN_READY_STATE = 1;

export class RealtimeTransport {
    private readonly requestTicket: RealtimeTransportOptions["requestTicket"];
    private readonly buildUrl: RealtimeTransportOptions["buildUrl"];
    private readonly createSocket: NonNullable<RealtimeTransportOptions["createSocket"]>;
    private readonly subscribeOnline?: RealtimeTransportOptions["subscribeOnline"];
    private readonly scheduler: TimerScheduler;
    private readonly now: () => number;
    private readonly random: () => number;
    private readonly baseRetryDelayMs: number;
    private readonly maxRetryDelayMs: number;
    private readonly retryJitterRatio: number;
    private readonly connectionTimeoutMs: number;
    private readonly healthCheckIntervalMs: number;

    private readonly messageListeners = new Set<MessageListener>();
    private readonly stateListeners = new Set<StateListener>();

    private socket: WebSocketLike | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private connectionTimer: ReturnType<typeof setTimeout> | null = null;
    private healthTimer: ReturnType<typeof setInterval> | null = null;
    private connectAbortController: AbortController | null = null;
    private unsubscribeOnline: (() => void) | null = null;
    private running = false;
    private generation = 0;
    private retryAttempt = 0;
    private snapshot: RealtimeConnectionSnapshot = {
        status: "idle",
        attempt: 0,
        connectedAt: null,
        lastMessageAt: null,
        retryDelayMs: null,
        reason: null,
    };

    constructor(options: RealtimeTransportOptions) {
        this.requestTicket = options.requestTicket;
        this.buildUrl = options.buildUrl;
        this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
        this.subscribeOnline = options.subscribeOnline;
        this.scheduler = options.scheduler ?? defaultScheduler;
        this.now = options.now ?? Date.now;
        this.random = options.random ?? Math.random;
        this.baseRetryDelayMs = options.baseRetryDelayMs ?? 1_000;
        this.maxRetryDelayMs = options.maxRetryDelayMs ?? 30_000;
        this.retryJitterRatio = options.retryJitterRatio ?? 0.25;
        this.connectionTimeoutMs = options.connectionTimeoutMs ?? 15_000;
        this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? 10_000;
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.unsubscribeOnline = this.subscribeOnline?.(() => this.reconnectNow()) ?? null;
        this.healthTimer = this.scheduler.setInterval(
            () => this.checkHealth(),
            this.healthCheckIntervalMs,
        );
        void this.connect();
    }

    stop() {
        if (!this.running && this.snapshot.status === "idle") return;

        this.running = false;
        this.generation += 1;
        this.clearReconnectTimer();
        this.clearConnectionTimer();
        this.connectAbortController?.abort();
        this.connectAbortController = null;
        this.closeSocket();

        if (this.healthTimer) {
            this.scheduler.clearInterval(this.healthTimer);
            this.healthTimer = null;
        }

        this.unsubscribeOnline?.();
        this.unsubscribeOnline = null;
        this.retryAttempt = 0;
        this.emitState({
            status: "idle",
            attempt: 0,
            connectedAt: null,
            lastMessageAt: null,
            retryDelayMs: null,
            reason: null,
        });
    }

    reconnectNow() {
        if (!this.running) {
            this.start();
            return;
        }

        const wasOpen = this.snapshot.status === "open";
        this.generation += 1;
        this.clearReconnectTimer();
        this.clearConnectionTimer();
        this.connectAbortController?.abort();
        this.connectAbortController = null;
        this.closeSocket();
        this.retryAttempt = 0;

        if (wasOpen) {
            this.emitState({
                status: "waiting",
                attempt: 0,
                connectedAt: null,
                lastMessageAt: this.snapshot.lastMessageAt,
                retryDelayMs: 0,
                reason: "reconnect-requested",
            });
        }

        void this.connect();
    }

    send(data: string) {
        if (!this.socket || this.snapshot.status !== "open") return false;
        if (this.socket.readyState !== OPEN_READY_STATE) return false;

        try {
            this.socket.send(data);
            return true;
        } catch {
            this.reconnectNow();
            return false;
        }
    }

    subscribe(listener: MessageListener) {
        this.messageListeners.add(listener);
        return () => this.messageListeners.delete(listener);
    }

    subscribeState(listener: StateListener) {
        this.stateListeners.add(listener);
        listener(this.snapshot);
        return () => this.stateListeners.delete(listener);
    }

    getSnapshot() {
        return this.snapshot;
    }

    private async connect() {
        if (!this.running) return;

        const generation = ++this.generation;
        this.clearReconnectTimer();
        this.clearConnectionTimer();
        this.connectAbortController?.abort();
        const abortController = new AbortController();
        this.connectAbortController = abortController;

        this.emitState({
            status: "connecting",
            attempt: this.retryAttempt,
            connectedAt: null,
            lastMessageAt: this.snapshot.lastMessageAt,
            retryDelayMs: null,
            reason: null,
        });

        this.connectionTimer = this.scheduler.setTimeout(() => {
            if (!this.isCurrent(generation)) return;
            this.scheduleReconnect("connection-timeout");
        }, this.connectionTimeoutMs);

        try {
            const ticket = await this.requestTicket(abortController.signal);
            if (!this.isCurrent(generation)) return;

            const socket = this.createSocket(this.buildUrl(ticket));
            if (!this.isCurrent(generation)) {
                socket.close();
                return;
            }

            this.closeSocket();
            this.socket = socket;
            socket.onopen = () => {
                if (!this.isCurrent(generation) || this.socket !== socket) return;

                this.clearConnectionTimer();
                this.retryAttempt = 0;
                const openedAt = this.now();
                this.emitState({
                    status: "open",
                    attempt: 0,
                    connectedAt: openedAt,
                    lastMessageAt: openedAt,
                    retryDelayMs: null,
                    reason: null,
                });
            };
            socket.onmessage = (event) => {
                if (!this.isCurrent(generation) || this.socket !== socket) return;
                if (typeof event.data !== "string") return;

                this.emitState({ ...this.snapshot, lastMessageAt: this.now() });
                this.messageListeners.forEach((listener) => listener(event.data));
            };
            socket.onerror = () => {
                if (!this.isCurrent(generation) || this.socket !== socket) return;
                this.scheduleReconnect("socket-error");
            };
            socket.onclose = () => {
                if (!this.isCurrent(generation) || this.socket !== socket) return;
                this.socket = null;
                this.scheduleReconnect("socket-close");
            };
        } catch (error) {
            if (!this.isCurrent(generation) || abortController.signal.aborted) return;
            this.scheduleReconnect(error instanceof Error ? error.message : "ticket-error");
        }
    }

    private scheduleReconnect(reason: string) {
        if (!this.running) return;

        this.generation += 1;
        this.clearConnectionTimer();
        this.connectAbortController?.abort();
        this.connectAbortController = null;
        this.closeSocket();
        this.clearReconnectTimer();

        const exponentialDelay = Math.min(
            this.maxRetryDelayMs,
            this.baseRetryDelayMs * 2 ** this.retryAttempt,
        );
        const jitter = 1 + (this.random() * 2 - 1) * this.retryJitterRatio;
        const retryDelayMs = Math.max(0, Math.round(exponentialDelay * jitter));
        this.retryAttempt += 1;

        this.emitState({
            status: "waiting",
            attempt: this.retryAttempt,
            connectedAt: null,
            lastMessageAt: this.snapshot.lastMessageAt,
            retryDelayMs,
            reason,
        });

        this.reconnectTimer = this.scheduler.setTimeout(() => {
            this.reconnectTimer = null;
            void this.connect();
        }, retryDelayMs);
    }

    private checkHealth() {
        if (!this.running) return;
        if (this.snapshot.status === "open" && this.socket?.readyState !== OPEN_READY_STATE) {
            this.scheduleReconnect("health-check-failed");
        }
    }

    private isCurrent(generation: number) {
        return this.running && this.generation === generation;
    }

    private closeSocket() {
        const socket = this.socket;
        this.socket = null;
        if (!socket) return;

        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        try {
            socket.close();
        } catch {
            // The socket is already unusable; reconnect scheduling is owned by the caller.
        }
    }

    private clearReconnectTimer() {
        if (!this.reconnectTimer) return;
        this.scheduler.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    private clearConnectionTimer() {
        if (!this.connectionTimer) return;
        this.scheduler.clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
    }

    private emitState(snapshot: RealtimeConnectionSnapshot) {
        this.snapshot = snapshot;
        this.stateListeners.forEach((listener) => listener(snapshot));
    }
}
