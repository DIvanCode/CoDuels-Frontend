/** An API instant with a timezone suffix. Validate untrusted values with parseIsoTimestamp. */
export type IsoTimestamp = string & { readonly __isoTimestamp: unique symbol };

export const dateLocale = "ru-RU";

const timestampPattern =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?(Z|[+-]\d{2}:\d{2})$/;
const legacyUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?$/;

/** Old Duely responses omitted the suffix while storing UTC wall-clock values. */
export const parseIsoTimestamp = (value?: string | null): Date | null => {
    if (!value) return null;

    const normalized = legacyUtcPattern.test(value) ? `${value}Z` : value;
    const match = timestampPattern.exec(normalized);
    if (!match) return null;

    const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offset] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > daysInMonth[month - 1] ||
        hour > 23 ||
        minute > 59 ||
        second > 59 ||
        (offset !== "Z" && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59))
    ) {
        return null;
    }

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const timestampMs = (value?: string | null): number | null =>
    parseIsoTimestamp(value)?.getTime() ?? null;

const format = (
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions,
    fallback: string,
    locale: string,
    timeZone?: string,
) => {
    const date = parseIsoTimestamp(value);
    return date ? new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date) : fallback;
};

export const formatIsoDate = (
    value?: string | null,
    fallback = "—",
    locale = dateLocale,
    timeZone?: string,
) =>
    format(
        value,
        { day: "2-digit", month: "2-digit", year: "numeric" },
        fallback,
        locale,
        timeZone,
    );

export const formatIsoDateTime = (
    value?: string | null,
    fallback = "—",
    locale = dateLocale,
    timeZone?: string,
) =>
    format(
        value,
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
        fallback,
        locale,
        timeZone,
    );

export const formatIsoDateTimeWithSeconds = (
    value?: string | null,
    fallback = "—",
    locale = dateLocale,
    timeZone?: string,
) =>
    format(
        value,
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        },
        fallback,
        locale,
        timeZone,
    );

export const formatRelativeTime = (
    value?: string | null,
    now = Date.now(),
    fallback = "—",
    locale = dateLocale,
) => {
    const timestamp = timestampMs(value);
    if (timestamp === null) return fallback;

    const seconds = Math.round((timestamp - now) / 1000);
    const magnitude = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (magnitude < 60) return formatter.format(seconds, "second");
    if (magnitude < 3600) return formatter.format(Math.round(seconds / 60), "minute");
    if (magnitude < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
    return formatter.format(Math.round(seconds / 86400), "day");
};
