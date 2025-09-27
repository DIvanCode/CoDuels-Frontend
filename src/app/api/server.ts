import { faker } from "@faker-js/faker/locale/en";
import { factory, primaryKey } from "@mswjs/data";
import { nanoid } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

const NUM_USERS = 3;

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

function getRandomInt(min: number, max: number) {
    return faker.number.int({ min, max });
}

const randomFromArray = <T>(array: T[]) => {
    const index = getRandomInt(0, array.length - 1);
    return array[index];
};

/* MSW Data Model Setup */

// TODO: добавить инфу про дуэли
export const db = factory({
    user: {
        id: primaryKey(nanoid),
        username: String,
        rating: Number,
    },
});

type ModelDB = typeof db;

type UserData = ReturnType<typeof createUserData>;
type User = ReturnType<typeof db.user.create>;

const createUserData = () => {
    const username = faker.person.firstName();
    const rating = faker.number.int({ min: 300, max: 2000 });

    return {
        username,
        rating,
    };
};

// Create an initial set of users
for (let i = 0; i < NUM_USERS; i++) {
    db.user.create(createUserData());
}

/* MSW REST API Handlers */

let currentUser: UserData | null = null;

export const handlers = [
    http.post("/fakeApi/login", async function ({ request }) {
        await delay(ARTIFICIAL_DELAY_MS);

        currentUser = randomFromArray(db.user.getAll());
        return HttpResponse.json({ success: true, user: currentUser });
    }),
    http.post("/fakeApi/logout", async function () {
        currentUser = null;
        return HttpResponse.json({ success: true });
    }),
];

export const worker = setupWorker(...handlers);
