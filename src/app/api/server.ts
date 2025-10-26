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

const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

/* MSW Data Model Setup */

export const db = factory({
    user: {
        id: primaryKey(() => randomInt(0, 1000)),
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
        opponent_user_id: number;
        status: "in_progress" | "finished" | "pending";
        task_id: string;
        starts_at: string;
        deadline_at: string;
    }
>();

/* In-memory submissions store */
const allSubmissions = new Map<
    string, // submission_id
    {
        submission_id: string;
        duel_id: string;
        user_id: string;
        solution: string;
        language: string;
        status: "queued" | "running" | "done";
        verdict?: string;
        message?: string;
        error?: string;
        created_at: string;
    }
>();

const duelSubmissions = new Map<string, string[]>();

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

    http.post("/fakeApi/duels/:duelId/submit", async function ({ params, request }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const duelId = params.duelId as string;
        const body = (await request.json()) as {
            user_id: string;
            solution: string;
            language: string;
        };

        const userId = body.user_id;

        const duel = duels.get(duelId);
        if (!duel) {
            return HttpResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        if (duel.status !== "in_progress") {
            return HttpResponse.json({ error: "Duel is not in progress" }, { status: 400 });
        }

        const deadline = new Date(duel.deadline_at);
        if (new Date() > deadline) {
            return HttpResponse.json({ error: "Duel deadline has passed" }, { status: 400 });
        }

        const submissionId = nanoid();
        const submission = {
            submission_id: submissionId,
            duel_id: duelId,
            user_id: userId,
            solution: body.solution,
            language: body.language,
            status: "queued" as const,
            created_at: new Date().toISOString(),
        };

        allSubmissions.set(submissionId, submission);

        if (!duelSubmissions.has(duelId)) {
            duelSubmissions.set(duelId, []);
        }
        duelSubmissions.get(duelId)!.push(submissionId);

        setTimeout(async () => {
            const submission = allSubmissions.get(submissionId);

            if (submission) {
                submission.status = "running";
                allSubmissions.set(submissionId, submission);

                await delay(ARTIFICIAL_DELAY_MS);
                console.log(`Submission ${submissionId}: Compilation completed`);

                const totalTests = 5;
                let failedTest = -1;
                const random = Math.random();

                if (random < 0.7) {
                    failedTest = -1;
                } else if (random < 0.8) {
                    failedTest = 2;
                } else if (random < 0.9) {
                    failedTest = 3;
                } else {
                    submission.status = "done";
                    submission.verdict = "Compilation Error";
                    submission.message = "Syntax error: expected ':'";
                    allSubmissions.set(submissionId, submission);
                    return;
                }

                for (let testNum = 1; testNum <= totalTests; testNum++) {
                    await delay(ARTIFICIAL_DELAY_MS);

                    if (failedTest === testNum) {
                        if (random < 0.8) {
                            console.log(
                                `Submission ${submissionId}: Test #${testNum} - WRONG ANSWER`,
                            );
                            submission.status = "done";
                            submission.verdict = `Wrong Answer on test #${testNum}`;
                            allSubmissions.set(submissionId, submission);
                            return;
                        } else {
                            console.log(
                                `Submission ${submissionId}: Test #${testNum} - TIME LIMIT EXCEEDED`,
                            );
                            submission.status = "done";
                            submission.verdict = `Time Limit on test #${testNum}`;
                            allSubmissions.set(submissionId, submission);
                            return;
                        }
                    } else {
                        console.log(`Submission ${submissionId}: Test #${testNum} - OK`);
                        submission.status = "running";
                        submission.verdict = `Test ${testNum} passed successfully`;
                    }
                }

                // Все тесты пройдены успешно
                await delay(ARTIFICIAL_DELAY_MS);
                console.log(`Submission ${submissionId}: All tests passed`);

                submission.status = "done";
                submission.verdict = "Accepted";
                allSubmissions.set(submissionId, submission);
            }
        }, 1000);

        return HttpResponse.json({
            submission_id: submissionId,
            status: "queued",
        });
    }),

    http.get("/fakeApi/user/:userId", async function ({ params }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const userId = Number(params.userId);
        const user = db.user.findFirst({
            where: {
                id: { equals: userId },
            },
        });

        return HttpResponse.json({ success: true, ...user });
    }),

    // SSE endpoint: subscribe to duel events
    http.get("/fakeApi/duels/events", function () {
        console.log("New SSE connection");

        // Вообще мы как-то должны матчить двух подписчиков, бла-бла,
        // но это же мок, поэтому мы не будем учитывать userId, просто считаем для приличия
        // const url = new URL(request.url);
        // const userId = url.searchParams.get("user_id");

        const duelId = nanoid();

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            start(controller) {
                const push = (str: string) => controller.enqueue(encoder.encode(str));

                // simulate matchmaking timeour
                setTimeout(() => {
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
                }, ARTIFICIAL_DELAY_MS * 2);

                // simulate winner timeout
                setTimeout(() => {
                    const duel = duels.get(duelId)!;
                    const winnerUserId = duel.opponent_user_id;

                    duel.status = "finished";
                    duels.set(duelId, duel);
                    push(`event: duel_finished\n`);

                    console.log("Send winner");

                    push(
                        `data: ${JSON.stringify({ duel_id: duelId, winner_user_id: winnerUserId })}\n\n`,
                    );
                }, ARTIFICIAL_DELAY_MS * 1000);
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

    http.get("/fakeApi/duels/:duelId/submissions", async function ({ params }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const duelId = params.duelId as string;

        const duel = duels.get(duelId);
        if (!duel) {
            return HttpResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        const submissionIds = duelSubmissions.get(duelId) || [];
        const userSubmissions = submissionIds
            .map((id) => allSubmissions.get(id))
            .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime())
            .map((sub) => ({
                submission_id: sub!.submission_id,
                status: sub!.status,
                verdict: sub!.verdict,
                created_at: sub!.created_at,
            }));

        return HttpResponse.json(userSubmissions);
    }),

    http.get("/fakeApi/duels/:duelId/submissions/:submissionId", async function ({ params }) {
        await delay(ARTIFICIAL_DELAY_MS);

        const { duelId, submissionId } = params;

        const duel = duels.get(duelId as string);
        if (!duel) {
            return HttpResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        const submission = allSubmissions.get(submissionId as string);

        if (!submission || submission.duel_id !== duelId) {
            return HttpResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return HttpResponse.json({
            submission_id: submission.submission_id,
            solution: submission.solution,
            language: submission.language,
            status: submission.status,
            verdict: submission.verdict,
            created_at: submission.created_at,
        });
    }),

    http.get("/fakeApi/task/:taskId", async function () {
        await delay(ARTIFICIAL_DELAY_MS);

        // Опять же забиваем на taskId, этож мок
        // const { taskId } = params;

        return HttpResponse.json({
            id: "4cf94aac-ae47-459b-bb6a-459784fecc66",
            name: "A + B",
            level: 1,
            statement: "statement.md",
            tl: 1000,
            ml: 256,
            tests: [
                {
                    order: 1,
                    inputFile: "01.in",
                    outputFile: "01.out",
                },
                {
                    order: 2,
                    inputFile: "02.in",
                    outputFile: "02.out",
                },
            ],
        });
    }),

    http.get("/fakeApi/task/:taskId/:filename", async function ({ params }) {
        await delay(ARTIFICIAL_DELAY_MS);

        // NOTE: на параметры забили, т.к. это мок
        const { filename } = params;

        const res = await fetch(`/${filename}`);

        if (!res.ok) {
            return new Response("File not found", {
                status: 404,
                headers: { "Content-Type": "text/plain" },
            });
        }

        const blob = await res.blob();
        return new Response(blob, {
            status: 200,
            headers: {
                "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
            },
        });
    }),
];

export const worker = setupWorker(...handlers);
