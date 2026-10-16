import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TournamentDetailsResponse } from "../../model/types";
import { GroupStageView } from "./GroupStageView";

vi.mock("shared/ui", () => ({
    Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
}));
vi.mock("shared/config", () => ({ AppRoutes: { DUEL: "/duel/:duelId" } }));

const nativeDateTimeFormat = Intl.DateTimeFormat;

const renderInTimeZone = (timeZone: string) => {
    Object.defineProperty(Intl, "DateTimeFormat", {
        configurable: true,
        value: function (locale: string, options: Intl.DateTimeFormatOptions) {
            return new nativeDateTimeFormat(locale, { ...options, timeZone });
        },
    });

    const user = (id: number, nickname: string) => ({
        id,
        nickname,
        rating: 1500,
        created_at: "2026-03-29T00:30:00Z",
        last_seen_at: null,
    });
    const duel = {
        id: 1,
        user1: user(1, "first"),
        user2: user(2, "second"),
        winner_id: null,
        status: "InProgress" as const,
        start_time: "2026-03-29T00:30:00Z",
        deadline_time: "2026-03-29T01:00:00Z",
    };
    const data = {
        tournament: {} as TournamentDetailsResponse["tournament"],
        group_stage: { standings: [], current_duels: [duel], past_duels: [] },
    };

    return renderToStaticMarkup(
        <MemoryRouter>
            <GroupStageView data={data} />
        </MemoryRouter>,
    );
};

afterEach(() => {
    Object.defineProperty(Intl, "DateTimeFormat", {
        configurable: true,
        value: nativeDateTimeFormat,
    });
});

describe("group-stage duel date", () => {
    it("renders one instant on the correct local calendar day in two timezones", () => {
        expect(renderInTimeZone("UTC")).toMatch(/29\.03\.2026/);
        expect(renderInTimeZone("America/New_York")).toMatch(/28\.03\.2026/);
    });
});
