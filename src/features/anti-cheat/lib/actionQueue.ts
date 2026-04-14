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

export const flushActionEvents = async ({
    baseUrl,
    token,
    shouldSend,
}: {
    baseUrl: string;
    token: string;
    shouldSend: boolean;
}) => {
    if (isFlushing || queue.length === 0) return;

    isFlushing = true;
    try {
        if (!shouldSend) {
            return;
        }

        for (let start = 0; start < queue.length; start += MAX_BATCH_SIZE) {
            const batch = queue.slice(start, start + MAX_BATCH_SIZE);

            await fetch(`${baseUrl}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ actions: batch }),
                keepalive: true,
            });
        }
    } finally {
        queue = [];
        sequenceByActor.clear();
        isFlushing = false;
    }
};

export const clearActionEventsQueue = () => {
    queue = [];
    sequenceByActor.clear();
};
