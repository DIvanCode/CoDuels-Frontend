import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Duel } from "entities/duel";
import type { UserData } from "entities/user";
import { UserStats } from "./UserStats";

vi.mock("shared/ui", () => ({
    AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}));

const user: UserData = {
    id: 1,
    nickname: "player",
    rating: 1500,
    created_at: "2026-10-15T10:00:00Z",
    last_seen_at: null,
};

const duel = (isRated: boolean, winnerId: number | null): Duel =>
    ({ is_rated: isRated, winner_id: winnerId }) as Duel;

const displayedValues = (duels: Duel[]): number[] => {
    const markup = renderToStaticMarkup(<UserStats user={user} userDuels={duels} />);
    return [...markup.matchAll(/<td><span>(\d+)<\/span><\/td>/g)].map((match) => Number(match[1]));
};

describe("UserStats", () => {
    it("counts rated wins, losses, and draws while ignoring friendly results", () => {
        expect(
            displayedValues([
                duel(true, 1),
                duel(true, 2),
                duel(true, null),
                duel(false, 1),
                duel(false, 2),
                duel(false, null),
            ]),
        ).toEqual([1500, 1, 1, 1]);
    });

    it("shows zero results when the user has only friendly duels", () => {
        expect(displayedValues([duel(false, 1), duel(false, 2), duel(false, null)])).toEqual([
            1500, 0, 0, 0,
        ]);
    });
});
