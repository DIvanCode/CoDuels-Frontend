const NUMERIC_EVENT_ID = /^\d+$/;

export class EventCursor {
    private readonly seenIds = new Set<string>();
    private readonly insertionOrder: string[] = [];
    private lastNumericId: bigint | null = null;

    constructor(
        initialEventId: string | null,
        private readonly capacity = 128,
    ) {
        if (initialEventId) this.remember(initialEventId);
    }

    accept(eventId: string | null) {
        if (!eventId) return true;
        if (this.seenIds.has(eventId)) return false;

        if (NUMERIC_EVENT_ID.test(eventId)) {
            const numericId = BigInt(eventId);
            if (this.lastNumericId !== null && numericId <= this.lastNumericId) return false;
            this.lastNumericId = numericId;
        }

        this.remember(eventId);
        return true;
    }

    private remember(eventId: string) {
        this.seenIds.add(eventId);
        this.insertionOrder.push(eventId);

        if (NUMERIC_EVENT_ID.test(eventId)) {
            const numericId = BigInt(eventId);
            if (this.lastNumericId === null || numericId > this.lastNumericId) {
                this.lastNumericId = numericId;
            }
        }

        while (this.insertionOrder.length > this.capacity) {
            const removed = this.insertionOrder.shift();
            if (removed) this.seenIds.delete(removed);
        }
    }
}
