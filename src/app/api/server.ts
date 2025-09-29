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

// TODO: добавить инфу про дуэли
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

/* MSW REST API Handlers */

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
];

export const worker = setupWorker(...handlers);
