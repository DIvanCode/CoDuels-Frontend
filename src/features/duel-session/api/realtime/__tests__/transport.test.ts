import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeTransport } from "../transport";

class FakeSocket {
    readyState = 0;
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    sent: string[] = [];
    closed = false;

    open() {
        this.readyState = 1;
        this.onopen?.({} as Event);
    }

    message(data: string) {
        this.onmessage?.({ data } as MessageEvent);
    }

    disconnect() {
        this.readyState = 3;
        this.onclose?.({} as CloseEvent);
    }

    send(data: string) {
        this.sent.push(data);
    }

    close() {
        this.closed = true;
        this.readyState = 3;
    }
}

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

afterEach(() => {
    vi.useRealTimers();
});

describe("RealtimeTransport", () => {
    it("reconnects established sockets with bounded backoff and resets after open", async () => {
        vi.useFakeTimers();
        const sockets: FakeSocket[] = [];
        const states: string[] = [];
        const requestTicket = vi.fn(async () => "ticket");
        const transport = new RealtimeTransport({
            requestTicket,
            buildUrl: (ticket) => `wss://example.test/connect?ticket=${ticket}`,
            createSocket: () => {
                const socket = new FakeSocket();
                sockets.push(socket);
                return socket;
            },
            random: () => 0.5,
            baseRetryDelayMs: 1_000,
            healthCheckIntervalMs: 60_000,
        });
        transport.subscribeState((snapshot) => states.push(snapshot.status));

        transport.start();
        await flushPromises();
        expect(sockets).toHaveLength(1);
        sockets[0].open();
        expect(transport.getSnapshot().status).toBe("open");

        sockets[0].disconnect();
        expect(transport.getSnapshot()).toMatchObject({
            status: "waiting",
            attempt: 1,
            retryDelayMs: 1_000,
        });

        await vi.advanceTimersByTimeAsync(1_000);
        await flushPromises();
        expect(sockets).toHaveLength(2);
        sockets[1].open();
        expect(transport.getSnapshot()).toMatchObject({ status: "open", attempt: 0 });
        expect(states).toContain("waiting");

        transport.stop();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("aborts pending ticket work and removes online listeners on stop", async () => {
        vi.useFakeTimers();
        let onlineListener: (() => void) | null = null;
        let removed = false;
        let aborted = false;
        const transport = new RealtimeTransport({
            requestTicket: (signal) =>
                new Promise(() => {
                    signal.addEventListener("abort", () => {
                        aborted = true;
                    });
                }),
            buildUrl: () => "wss://example.test/connect",
            subscribeOnline: (listener) => {
                onlineListener = listener;
                return () => {
                    removed = true;
                    onlineListener = null;
                };
            },
        });

        transport.start();
        await flushPromises();
        expect(onlineListener).not.toBeNull();
        transport.stop();

        expect(aborted).toBe(true);
        expect(removed).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("reports an established socket as disconnected before an immediate reconnect", async () => {
        vi.useFakeTimers();
        const sockets: FakeSocket[] = [];
        const states: string[] = [];
        let onlineListener: () => void = () => undefined;
        const transport = new RealtimeTransport({
            requestTicket: vi.fn(async () => "ticket"),
            buildUrl: () => "wss://example.test/connect",
            createSocket: () => {
                const socket = new FakeSocket();
                sockets.push(socket);
                return socket;
            },
            subscribeOnline: (listener) => {
                onlineListener = listener;
                return () => undefined;
            },
        });
        transport.subscribeState((snapshot) => states.push(snapshot.status));

        transport.start();
        await flushPromises();
        sockets[0].open();

        onlineListener();
        await flushPromises();

        expect(sockets[0].closed).toBe(true);
        expect(sockets).toHaveLength(2);
        expect(states.slice(-3)).toEqual(["open", "waiting", "connecting"]);

        transport.stop();
    });
});
