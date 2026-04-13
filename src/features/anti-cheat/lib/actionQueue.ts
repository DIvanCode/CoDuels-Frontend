import type { ActionEvent, ActionEventInput } from "../model/types";

const MAX_BATCH_SIZE = 200;

let queue: ActionEvent[] = [];
const sequenceByActor = new Map<string, number>();
let isFlushing = false;

const makeActorKey = (duelId: number, userId: number) => `${duelId}:${userId}`;

const nextSequenceId = (duelId: number, userId: number): number => {
    const key = makeActorKey(duelId, userId);
    const previous = sequenceByActor.get(key) ?? 0;
    const next = previous + 1;
    sequenceByActor.set(key, next);
    return next;
};

const makeEvent = (input: ActionEventInput): ActionEvent =>
    (({ type, ...rest }) => ({
        type,
        ...rest,
        event_id: crypto.randomUUID(),
        sequence_id: nextSequenceId(input.duel_id, input.user_id),
        timestamp: new Date().toISOString(),
    }))(input) as ActionEvent;

export const pushActionEvent = (input: ActionEventInput) => {
    queue.push(makeEvent(input));
};

export const flushActionEvents = async ({ baseUrl, token }: { baseUrl: string; token: string }) => {
    if (isFlushing || queue.length === 0) return;

    isFlushing = true;
    try {
        while (queue.length > 0) {
            const batch = queue.slice(0, MAX_BATCH_SIZE);

            const response = await fetch(`${baseUrl}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ actions: batch }),
                keepalive: true,
            });

            if (!response.ok) {
                break;
            }

            const sentIds = new Set(batch.map((event) => event.event_id));
            queue = queue.filter((event) => !sentIds.has(event.event_id));
        }
    } finally {
        isFlushing = false;
    }
};

export const clearActionEventsQueue = () => {
    queue = [];
    sequenceByActor.clear();
};
