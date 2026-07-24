import { describe, expect, it, vi } from "vitest";

import { EventRouter } from "../eventRouter";
import { DuelRealtimeSession } from "../session";
import type { RealtimeConnectionSnapshot } from "../types";

const snapshot = (status: RealtimeConnectionSnapshot["status"]): RealtimeConnectionSnapshot => ({
    status,
    attempt: status === "waiting" ? 1 : 0,
    connectedAt: status === "open" ? 1 : null,
    lastMessageAt: null,
    retryDelayMs: status === "waiting" ? 1_000 : null,
    reason: status === "waiting" ? "socket-close" : null,
});

class FakeTransport {
    private messageListeners = new Set<(message: string) => void>();
    private stateListeners = new Set<(value: RealtimeConnectionSnapshot) => void>();
    start = vi.fn();
    stop = vi.fn();
    reconnectNow = vi.fn();

    subscribe(listener: (message: string) => void) {
        this.messageListeners.add(listener);
        return () => this.messageListeners.delete(listener);
    }

    subscribeState(listener: (value: RealtimeConnectionSnapshot) => void) {
        this.stateListeners.add(listener);
        listener(snapshot("idle"));
        return () => this.stateListeners.delete(listener);
    }

    emitMessage(message: string) {
        this.messageListeners.forEach((listener) => listener(message));
    }

    emitState(status: RealtimeConnectionSnapshot["status"]) {
        this.stateListeners.forEach((listener) => listener(snapshot(status)));
    }
}

const createPublisher = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    flush: vi.fn(),
});

describe("DuelRealtimeSession integration", () => {
    it("preserves pending state when connection attempts fail before the first open", () => {
        const transport = new FakeTransport();
        const onDisconnected = vi.fn();
        const interruptions: boolean[] = [];
        const session = new DuelRealtimeSession({
            transport,
            publisher: createPublisher(),
            router: new EventRouter({ handlers: {} }),
            reconcile: vi.fn(),
            onInterrupted: (value) => interruptions.push(value),
            onDisconnected,
        });

        session.start();
        transport.emitState("connecting");
        transport.emitState("waiting");
        expect(onDisconnected).not.toHaveBeenCalled();

        transport.emitState("connecting");
        transport.emitState("open");
        transport.emitState("waiting");
        expect(onDisconnected).toHaveBeenCalledOnce();
        expect(interruptions).toEqual([true, false, true]);
        session.stop();
    });

    it("syncs initial state, reports disconnects, reconnects without reload, and ignores stale messages", async () => {
        const transport = new FakeTransport();
        const publisher = createPublisher();
        const reconcile = vi.fn(async () => undefined);
        const interruptions: boolean[] = [];
        const onDisconnected = vi.fn();
        const duelStarted = vi.fn();
        const router = new EventRouter({ handlers: { DuelStarted: [duelStarted] } });
        const session = new DuelRealtimeSession({
            transport,
            publisher,
            router,
            reconcile,
            onInterrupted: (value) => interruptions.push(value),
            onDisconnected,
        });

        session.start();
        transport.emitState("open");
        await Promise.resolve();
        expect(reconcile).toHaveBeenCalledOnce();
        expect(publisher.reset).toHaveBeenCalledOnce();
        expect(publisher.flush).toHaveBeenCalledOnce();

        transport.emitMessage(
            JSON.stringify({ type: "DuelStarted", duel_id: 12, last_event_id: "8" }),
        );
        transport.emitMessage(
            JSON.stringify({ type: "DuelStarted", duel_id: 12, last_event_id: "8" }),
        );
        transport.emitMessage(JSON.stringify({ type: "FutureEvent" }));
        expect(duelStarted).toHaveBeenCalledOnce();

        transport.emitState("waiting");
        expect(onDisconnected).toHaveBeenCalledOnce();
        expect(interruptions).toEqual([false, true]);
        session.reconnectNow();
        expect(transport.reconnectNow).toHaveBeenCalledOnce();

        session.stop();
        transport.emitMessage(JSON.stringify({ type: "DuelStarted", duel_id: 13 }));
        transport.emitState("open");
        expect(duelStarted).toHaveBeenCalledOnce();
        expect(reconcile).toHaveBeenCalledOnce();
        expect(transport.stop).toHaveBeenCalledOnce();
    });

    it("fences logout and user changes by stopping the previous session subscriptions", () => {
        const oldTransport = new FakeTransport();
        const newTransport = new FakeTransport();
        const oldHandler = vi.fn();
        const newHandler = vi.fn();
        const makeSession = (transport: FakeTransport, handler: () => void) =>
            new DuelRealtimeSession({
                transport,
                publisher: createPublisher(),
                router: new EventRouter({ handlers: { DuelChanged: [handler] } }),
                reconcile: vi.fn(),
                onInterrupted: vi.fn(),
                onDisconnected: vi.fn(),
            });

        const oldSession = makeSession(oldTransport, oldHandler);
        oldSession.start();
        oldSession.stop();

        const newSession = makeSession(newTransport, newHandler);
        newSession.start();
        oldTransport.emitMessage(JSON.stringify({ type: "DuelChanged", duel_id: 1 }));
        newTransport.emitMessage(JSON.stringify({ type: "DuelChanged", duel_id: 2 }));

        expect(oldHandler).not.toHaveBeenCalled();
        expect(newHandler).toHaveBeenCalledOnce();
        newSession.stop();
    });
});
