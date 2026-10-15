import { timestampMs } from "shared/lib/isoTimestamp";

const pluralize = (value: number, one: string, few: string, many: string): string => {
    const lastTwoDigits = value % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return many;

    const lastDigit = value % 10;
    if (lastDigit === 1) return one;
    if (lastDigit >= 2 && lastDigit <= 4) return few;
    return many;
};

export const formatDuelDuration = (startTime?: string | null, endTime?: string | null): string => {
    const startMs = timestampMs(startTime);
    const endMs = timestampMs(endTime);
    if (startMs === null || endMs === null || endMs < startMs) return "—";

    const totalSeconds = Math.floor((endMs - startMs) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} ${pluralize(hours, "час", "часа", "часов")}`);
    if (minutes > 0) parts.push(`${minutes} ${pluralize(minutes, "минута", "минуты", "минут")}`);
    parts.push(`${seconds} ${pluralize(seconds, "секунда", "секунды", "секунд")}`);

    return parts.join(" ");
};
