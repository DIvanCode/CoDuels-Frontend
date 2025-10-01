import { faker } from "@faker-js/faker/locale/en";
import { factory, primaryKey } from "@mswjs/data";
import { nanoid } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 1000;

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/* RNG setup */

// Set up a seeded random number generator, so that we get
// a consistent set of users / entries each time the page loads.
// This can be reset by deleting this localStorage value,
// or turned off by setting `useSeededRNG` to false.
const useSeededRNG = true;

if (useSeededRNG) {
    let randomSeedString = localStorage.getItem("randomTimestampSeed");
    let seedDate;

    if (randomSeedString) {
        seedDate = new Date(randomSeedString);
    } else {
        seedDate = new Date();
        randomSeedString = seedDate.toISOString();
        localStorage.setItem("randomTimestampSeed", randomSeedString);
    }

    faker.seed(seedDate.getTime());
}

/* MSW Data Model Setup */

export const db = factory({
    user: {
        id: primaryKey(nanoid),
        username: String,
        rating: Number,
    },
});

const createUserData = (
    username = faker.person.firstName(),
    rating = faker.number.int({ min: 300, max: 2000 }),
) => {
    return {
        username,
        rating,
    };
};

/* In-memory duels store */
const duels = new Map<
    string,
    {
        id: string;
        opponent_user_id: string;
        status: "in_progress" | "finished" | "pending";
        task_id: string;
        starts_at: string;
        deadline_at: string;
    }
>();

/* MSW REST / SSE API Handlers */

export const handlers = [
    http.post("/fakeApi/register", async function ({ request }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const body = (await request.json()) as { email: string; password: string };

        const user = db.user.create(createUserData(body.email.split("@")[0]));

        return HttpResponse.json({ success: true, user });
    }),

    http.post("/fakeApi/login", async function ({ request }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const body = (await request.json()) as { username: string; password: string };
        const currentUser = db.user.findFirst({
            where: {
                username: { equals: body.username },
            },
        });
        return HttpResponse.json({ success: true, user: currentUser });
    }),

    http.post("/fakeApi/logout", async function () {
        return HttpResponse.json({ success: true });
    }),

    // SSE endpoint: subscribe to duel events
    http.get("/fakeApi/duels/events", function ({ request }) {
        console.log("New SSE connection");

        // Вообще мы как-то должны матчить двух подписчиков, бла-бла,
        // но это же мок, поэтому мы не будем учитывать userId, просто считаем для приличия
        const url = new URL(request.url);
        const userId = url.searchParams.get("user_id");

        const duelId = nanoid();

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            start(controller) {
                const push = (str: string) => controller.enqueue(encoder.encode(str));

                // simulate matchmaking after 2 seconds
                const matchTimeout = setTimeout(() => {
                    // Creating random user that will win
                    const opponent = db.user.create(createUserData());

                    const startsAt = new Date().toISOString();
                    const deadlineAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                    const duel = {
                        id: duelId,
                        opponent_user_id: opponent.id,
                        status: "in_progress" as const,
                        task_id: nanoid(),
                        starts_at: startsAt,
                        deadline_at: deadlineAt,
                    };

                    duels.set(duelId, duel);

                    push(`event: duel_started\n`);
                    push(`data: ${JSON.stringify({ duel_id: duelId })}\n\n`);
                }, 2000);

                // simulate winner after 5 seconds
                const winnerInterval = setTimeout(() => {
                    const duel = duels.get(duelId)!;
                    const winnerUserId = duel.opponent_user_id;

                    duel.status = "finished";
                    duels.set(duelId, duel);
                    push(`event: duel_finished\n`);

                    console.log("Send winner");

                    push(
                        `data: ${JSON.stringify({ duel_id: duelId, winner_user_id: winnerUserId })}\n\n`,
                    );
                }, 5000);

                // close stream on abort
                const abortHandler = () => {
                    clearTimeout(matchTimeout);
                    clearInterval(winnerInterval);
                    try {
                        controller.close();
                    } catch {
                        // no-op
                    }
                };

                // request.signal exists in Service Worker fetch handler
                if (request.signal) {
                    request.signal.addEventListener("abort", abortHandler);
                }
            },
            cancel() {
                // stream closed by client
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
            status: 200,
        });
    }),

    http.get("/fakeApi/duels/:duelId", async function ({ params }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const duelId = params.duelId as string;
        const duel = duels.get(duelId);

        if (!duel) {
            return new Response(JSON.stringify({ error: "Duel not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(duel), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
];

export const worker = setupWorker(...handlers);
