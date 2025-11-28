export function formatDuration(ms: number): string {
    if (ms < 0) ms = 0;

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days} д`);
    if (hours % 24 > 0) parts.push(`${hours % 24} ч`);
    if (minutes > 0) parts.push(`${minutes} мин`);
    if (seconds > 0) parts.push(`${seconds} сек`);

    if (parts.length === 0) return "меньше секунды";

    return parts.slice(0, 2).join(" ");
}

export function formatDurationBetween(start: Date, end: Date) {
    return formatDuration(end.getTime() - start.getTime());
}
