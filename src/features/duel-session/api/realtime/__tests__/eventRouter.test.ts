import { describe, expect, it, vi } from "vitest";

import { EventRouter } from "../eventRouter";

describe("EventRouter", () => {
    it("validates flat events and drops duplicate or older cursor values", () => {
        const handler = vi.fn();
        const acceptedIds: string[] = [];
        const router = new EventRouter({
            handlers: { DuelStarted: [handler] },
            onAcceptedEventId: (eventId) => acceptedIds.push(eventId),
        });

        expect(
            router.route(JSON.stringify({ type: "DuelStarted", duel_id: 7, last_event_id: "2" })),
        ).toBe("handled");
        expect(
            router.route(JSON.stringify({ type: "DuelStarted", duel_id: 7, last_event_id: "2" })),
        ).toBe("stale");
        expect(
            router.route(JSON.stringify({ type: "DuelStarted", duel_id: 9, last_event_id: "1" })),
        ).toBe("stale");

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({
            type: "DuelStarted",
            payload: { duel_id: 7 },
        });
        expect(acceptedIds).toEqual(["2"]);
    });

    it("isolates unknown, malformed, and failing handlers", () => {
        const onHandlerError = vi.fn();
        const router = new EventRouter({
            handlers: {
                DuelChanged: [
                    () => {
                        throw new Error("handler failed");
                    },
                ],
            },
            onHandlerError,
        });

        expect(router.route(JSON.stringify({ type: "FutureEvent", value: 1 }))).toBe("unknown");
        expect(router.route("not-json")).toBe("invalid");
        expect(router.route(JSON.stringify({ type: "DuelChanged", duel_id: 4 }))).toBe("handled");
        expect(onHandlerError).toHaveBeenCalledOnce();
    });

    it("accepts stringified envelope payloads and rejects invalid known payloads", () => {
        const handler = vi.fn();
        const router = new EventRouter({ handlers: { SubmissionStatusUpdated: [handler] } });

        expect(
            router.route(
                JSON.stringify({
                    event: "SubmissionStatusUpdated",
                    payload: JSON.stringify({
                        duel_id: 3,
                        submission_id: 8,
                        status: "Done",
                        verdict: "OK",
                    }),
                }),
            ),
        ).toBe("handled");
        expect(
            router.route(
                JSON.stringify({
                    type: "SubmissionStatusUpdated",
                    duel_id: 3,
                    submission_id: "8",
                    status: "Done",
                }),
            ),
        ).toBe("invalid");
    });
});
