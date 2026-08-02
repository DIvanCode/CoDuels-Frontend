import { describe, expect, it } from "vitest";

import {
    getDuelResultAcknowledgementKey,
    isDuelResultAcknowledged,
    persistDuelResultAcknowledgement,
    removeLegacyDuelResultDismissals,
} from "./duelResultAcknowledgement";

class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length() {
        return this.values.size;
    }

    clear() {
        this.values.clear();
    }

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    key(index: number) {
        return [...this.values.keys()][index] ?? null;
    }

    removeItem(key: string) {
        this.values.delete(key);
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }
}

describe("duel result acknowledgement storage", () => {
    it("scopes acknowledgement by user and shares it through the backing storage", () => {
        const sharedStorage = new MemoryStorage();
        persistDuelResultAcknowledgement(7, 42, sharedStorage);

        expect(isDuelResultAcknowledged(7, 42, sharedStorage)).toBe(true);
        expect(isDuelResultAcknowledged(8, 42, sharedStorage)).toBe(false);
        expect(isDuelResultAcknowledged(7, 43, sharedStorage)).toBe(false);
    });

    it("removes unscoped legacy keys without touching current or unrelated values", () => {
        const storage = new MemoryStorage();
        storage.setItem("duel:42:resultDismissed", "true");
        storage.setItem("duel:43:resultDismissed", "false");
        storage.setItem(getDuelResultAcknowledgementKey(7, 42), "1");
        storage.setItem("theme", "dark");

        removeLegacyDuelResultDismissals(storage);

        expect(storage.getItem("duel:42:resultDismissed")).toBeNull();
        expect(storage.getItem("duel:43:resultDismissed")).toBeNull();
        expect(storage.getItem(getDuelResultAcknowledgementKey(7, 42))).toBe("1");
        expect(storage.getItem("theme")).toBe("dark");
    });
});
