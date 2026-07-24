import { EventCursor } from "./eventCursor";
import { parseRealtimeMessage } from "./eventParser";
import type { KnownRealtimeEvent, RealtimeEventHandlers } from "./types";

interface EventRouterOptions {
    handlers: RealtimeEventHandlers;
    initialEventId?: string | null;
    onAcceptedEventId?: (eventId: string) => void;
    onIgnored?: (reason: string, eventName: string | null) => void;
    onHandlerError?: (error: unknown, event: KnownRealtimeEvent) => void;
}

export type EventRouteResult = "handled" | "unhandled" | "unknown" | "invalid" | "stale";

export class EventRouter {
    private readonly cursor: EventCursor;

    constructor(private readonly options: EventRouterOptions) {
        this.cursor = new EventCursor(options.initialEventId ?? null);
    }

    route(rawMessage: string): EventRouteResult {
        const parsed = parseRealtimeMessage(rawMessage);
        if (parsed.kind === "invalid") {
            this.options.onIgnored?.(parsed.reason, parsed.eventName);
            return "invalid";
        }
        if (parsed.kind === "unknown") {
            this.options.onIgnored?.("unknown-event", parsed.eventName);
            return "unknown";
        }
        if (!this.cursor.accept(parsed.event.eventId)) {
            this.options.onIgnored?.("duplicate-or-out-of-order", parsed.event.type);
            return "stale";
        }

        if (parsed.event.eventId) {
            this.options.onAcceptedEventId?.(parsed.event.eventId);
        }

        const handlers = this.options.handlers[parsed.event.type] as
            | ((event: KnownRealtimeEvent) => void)[]
            | undefined;
        if (!handlers || handlers.length === 0) {
            this.options.onIgnored?.("unhandled-known-event", parsed.event.type);
            return "unhandled";
        }

        handlers.forEach((handler) => {
            try {
                handler(parsed.event);
            } catch (error) {
                this.options.onHandlerError?.(error, parsed.event);
            }
        });
        return "handled";
    }
}
