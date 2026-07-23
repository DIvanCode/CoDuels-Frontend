export interface SolutionSnapshot {
    duelId: number;
    taskKey: string;
    language: string;
    solution: string;
}

interface SolutionPublisherOptions {
    getSnapshot: () => SolutionSnapshot | null;
    send: (message: string) => boolean;
    intervalMs?: number;
    setIntervalFn?: typeof setInterval;
    clearIntervalFn?: typeof clearInterval;
}

export class SolutionPublisher {
    private readonly intervalMs: number;
    private readonly setIntervalFn: typeof setInterval;
    private readonly clearIntervalFn: typeof clearInterval;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private lastSent: SolutionSnapshot | null = null;

    constructor(private readonly options: SolutionPublisherOptions) {
        this.intervalMs = options.intervalMs ?? 1_000;
        this.setIntervalFn =
            options.setIntervalFn ??
            ((callback, delayMs) => globalThis.setInterval(callback, delayMs));
        this.clearIntervalFn =
            options.clearIntervalFn ?? ((intervalId) => globalThis.clearInterval(intervalId));
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = this.setIntervalFn(() => this.flush(), this.intervalMs);
    }

    stop() {
        if (this.intervalId) {
            this.clearIntervalFn(this.intervalId);
            this.intervalId = null;
        }
        this.lastSent = null;
    }

    reset() {
        this.lastSent = null;
    }

    flush() {
        const snapshot = this.options.getSnapshot();
        if (!snapshot || this.isDuplicate(snapshot)) return false;

        const sent = this.options.send(
            JSON.stringify({
                type: "SolutionUpdated",
                duel_id: snapshot.duelId,
                task_key: snapshot.taskKey,
                language: snapshot.language,
                solution: snapshot.solution,
            }),
        );

        if (sent) this.lastSent = { ...snapshot };
        return sent;
    }

    private isDuplicate(snapshot: SolutionSnapshot) {
        return (
            this.lastSent?.duelId === snapshot.duelId &&
            this.lastSent.taskKey === snapshot.taskKey &&
            this.lastSent.language === snapshot.language &&
            this.lastSent.solution === snapshot.solution
        );
    }
}
