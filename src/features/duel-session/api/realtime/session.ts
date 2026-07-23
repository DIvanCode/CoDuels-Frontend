import type { RealtimeConnectionSnapshot } from "./types";

interface SessionTransport {
    start(): void;
    stop(): void;
    reconnectNow(): void;
    subscribe(listener: (message: string) => void): () => void;
    subscribeState(listener: (snapshot: RealtimeConnectionSnapshot) => void): () => void;
}

interface SessionRouter {
    route(message: string): unknown;
}

interface SessionPublisher {
    start(): void;
    stop(): void;
    reset(): void;
    flush(): unknown;
}

interface DuelRealtimeSessionOptions {
    transport: SessionTransport;
    router: SessionRouter;
    publisher: SessionPublisher;
    reconcile: () => void | Promise<void>;
    onInterrupted: (interrupted: boolean) => void;
    onDisconnected: () => void;
    onError?: (error: unknown) => void;
}

export class DuelRealtimeSession {
    private unsubscribers: (() => void)[] = [];
    private running = false;
    private lastConnectionStatus: RealtimeConnectionSnapshot["status"] | null = null;

    constructor(private readonly options: DuelRealtimeSessionOptions) {}

    start() {
        if (this.running) return;
        this.running = true;
        this.lastConnectionStatus = null;
        this.unsubscribers = [
            this.options.transport.subscribe((message) => {
                if (this.running) this.options.router.route(message);
            }),
            this.options.transport.subscribeState((snapshot) => {
                if (this.running) this.handleConnectionState(snapshot);
            }),
        ];
        this.options.publisher.start();
        this.options.transport.start();
    }

    stop() {
        if (!this.running) return;
        this.running = false;
        this.lastConnectionStatus = null;
        this.unsubscribers.forEach((unsubscribe) => unsubscribe());
        this.unsubscribers = [];
        this.options.publisher.stop();
        this.options.transport.stop();
    }

    reconnectNow() {
        if (!this.running) return;
        this.options.transport.reconnectNow();
    }

    private handleConnectionState(snapshot: RealtimeConnectionSnapshot) {
        if (snapshot.status === this.lastConnectionStatus) return;
        this.lastConnectionStatus = snapshot.status;

        if (snapshot.status === "open") {
            this.options.onInterrupted(false);
            this.options.publisher.reset();
            this.options.publisher.flush();
            Promise.resolve(this.options.reconcile()).catch((error) =>
                this.options.onError?.(error),
            );
            return;
        }

        if (snapshot.status === "waiting") {
            this.options.onDisconnected();
            this.options.onInterrupted(true);
        }
    }
}
