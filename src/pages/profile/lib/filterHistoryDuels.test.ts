import { describe, expect, it } from "vitest";

import type { Duel } from "entities/duel";
import { filterHistoryDuels } from "./filterHistoryDuels";

const duels = [
    { id: 1, is_rated: false },
    { id: 2, is_rated: true },
    { id: 3, is_rated: false },
] as Duel[];

describe("filterHistoryDuels", () => {
    it("shows only rated duels when enabled", () => {
        expect(filterHistoryDuels(duels, true).map((duel) => duel.id)).toEqual([2]);
    });

    it("shows the complete response when disabled without changing it", () => {
        expect(filterHistoryDuels(duels, false)).toEqual(duels);
        expect(duels).toHaveLength(3);
    });

    it("returns an empty history when no duel matches", () => {
        expect(
            filterHistoryDuels(
                duels.filter((duel) => !duel.is_rated),
                true,
            ),
        ).toEqual([]);
    });
});
