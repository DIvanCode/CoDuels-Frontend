import { afterEach, describe, expect, it, vi } from "vitest";

import { SolutionPublisher, type SolutionSnapshot } from "../solutionPublisher";

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("SolutionPublisher", () => {
    it("invokes browser timers with the global object as receiver", () => {
        const setIntervalSpy = vi
            .spyOn(globalThis, "setInterval")
            .mockReturnValue(1 as ReturnType<typeof setInterval>);
        const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval").mockImplementation(() => {});
        const publisher = new SolutionPublisher({
            getSnapshot: () => null,
            send: vi.fn(),
        });

        publisher.start();
        expect(setIntervalSpy.mock.contexts[0]).toBe(globalThis);

        publisher.stop();
        expect(clearIntervalSpy.mock.contexts[0]).toBe(globalThis);
    });

    it("throttles ordered snapshots, deduplicates successful sends, and retries failures", () => {
        vi.useFakeTimers();
        let snapshot: SolutionSnapshot | null = {
            duelId: 1,
            taskKey: "A",
            language: "Cpp",
            solution: "first",
        };
        let canSend = true;
        const messages: string[] = [];
        const publisher = new SolutionPublisher({
            getSnapshot: () => snapshot,
            send: (message) => {
                if (!canSend) return false;
                messages.push(message);
                return true;
            },
        });

        publisher.start();
        vi.advanceTimersByTime(1_000);
        vi.advanceTimersByTime(2_000);
        expect(messages).toHaveLength(1);

        snapshot = { ...snapshot, solution: "second" };
        vi.advanceTimersByTime(1_000);
        expect(messages).toHaveLength(2);
        expect(JSON.parse(messages[1])).toMatchObject({ solution: "second", task_key: "A" });

        canSend = false;
        snapshot = { ...snapshot, solution: "third" };
        vi.advanceTimersByTime(1_000);
        expect(messages).toHaveLength(2);
        canSend = true;
        vi.advanceTimersByTime(1_000);
        expect(messages).toHaveLength(3);

        publisher.reset();
        expect(publisher.flush()).toBe(true);
        expect(messages).toHaveLength(4);
        publisher.stop();
        expect(vi.getTimerCount()).toBe(0);
    });
});
