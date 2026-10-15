import { describe, expect, it } from "vitest";

import { formatDuelDuration } from "./formatDuelDuration";

const start = "2026-10-15T10:00:00Z";

describe("formatDuelDuration", () => {
    it.each([
        ["2026-10-15T10:00:45Z", "45 секунд"],
        ["2026-10-15T10:02:00Z", "2 минуты 0 секунд"],
        ["2026-10-15T11:00:05Z", "1 час 5 секунд"],
        ["2026-10-16T13:02:03Z", "27 часов 2 минуты 3 секунды"],
        ["2026-10-15T10:00:00Z", "0 секунд"],
        ["2026-10-15T10:21:11Z", "21 минута 11 секунд"],
        ["2026-10-15T12:14:01Z", "2 часа 14 минут 1 секунда"],
    ])("formats the interval ending at %s", (end, expected) => {
        expect(formatDuelDuration(start, end)).toBe(expected);
    });

    it("compares instants across explicit timezone offsets", () => {
        expect(formatDuelDuration(start, "2026-10-15T13:01:00+03:00")).toBe("1 минута 0 секунд");
    });

    it.each([undefined, null, "", "not-a-date", "2026-10-15T09:59:59Z"])(
        "returns a fallback for missing, invalid, or earlier end time %s",
        (end) => {
            expect(formatDuelDuration(start, end)).toBe("—");
        },
    );

    it("returns a fallback for an invalid start time", () => {
        expect(formatDuelDuration("2026-02-30T10:00:00Z", start)).toBe("—");
    });
});
