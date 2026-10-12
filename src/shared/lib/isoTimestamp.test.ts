import { describe, expect, it } from "vitest";

import {
    formatIsoDate,
    formatIsoDateTime,
    formatRelativeTime,
    parseIsoTimestamp,
    timestampMs,
} from "./isoTimestamp";

describe("ISO timestamps", () => {
    it("resolves Z and explicit offsets to the same instant", () => {
        const utc = timestampMs("2026-03-29T00:30:00Z");
        expect(timestampMs("2026-03-29T03:30:00+03:00")).toBe(utc);
        expect(timestampMs("2026-03-28T19:30:00-05:00")).toBe(utc);
    });

    it("keeps instants stable across UTC midnight and DST transitions", () => {
        expect(timestampMs("2026-03-29T00:30:00+01:00")).toBe(Date.parse("2026-03-28T23:30:00Z"));
        expect(timestampMs("2026-03-29T03:30:00+02:00")).toBe(Date.parse("2026-03-29T01:30:00Z"));
    });

    it("treats legacy offsetless Duely values as UTC during migration", () => {
        expect(timestampMs("2026-08-09T10:00:00")).toBe(timestampMs("2026-08-09T10:00:00Z"));
    });

    it.each(["", "not-a-date", "2026-02-29T10:00:00Z", "2026-13-01T10:00:00Z", "2026-01-01"])(
        "returns a safe fallback for invalid timestamp %s",
        (value) => {
            expect(parseIsoTimestamp(value)).toBeNull();
            expect(formatIsoDateTime(value)).toBe("—");
            expect(formatRelativeTime(value)).toBe("—");
        },
    );

    it("formats the same instant in two display timezones", () => {
        const instant = "2026-03-29T00:30:00Z";
        expect(formatIsoDate(instant, "—", "ru-RU", "UTC")).toBe("29.03.2026");
        expect(formatIsoDate(instant, "—", "ru-RU", "America/New_York")).toBe("28.03.2026");
        expect(formatIsoDateTime(instant, "—", "ru-RU", "UTC")).not.toBe(
            formatIsoDateTime(instant, "—", "ru-RU", "America/New_York"),
        );
    });
});
