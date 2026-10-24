export type AdminSectionId = "users" | "duels" | "submissions" | "groups" | "tournaments";

export interface AdminViewState {
    scrollTop: number;
    openSections: Partial<Record<AdminSectionId, boolean>>;
}

const sectionIds: AdminSectionId[] = ["users", "duels", "submissions", "groups", "tournaments"];
const memory = new Map<string, AdminViewState>();

const emptyState = (): AdminViewState => ({ scrollTop: 0, openSections: {} });
const storageKey = (userId: number, historyKey: string) => `admin-view:v1:${userId}:${historyKey}`;

export const readAdminViewState = (userId: number | null, historyKey: string): AdminViewState => {
    if (userId === null || typeof window === "undefined") return emptyState();

    const key = storageKey(userId, historyKey);
    const remembered = memory.get(key);
    if (remembered) return remembered;

    // A new document starts with React Router's default key; a reload keeps its entry.
    const navigation = window.performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
    if (historyKey === "default" && navigation?.type === "navigate") return emptyState();

    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return emptyState();

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return emptyState();
        if (!("version" in parsed) || parsed.version !== 1) return emptyState();
        if (!("scrollTop" in parsed) || typeof parsed.scrollTop !== "number") return emptyState();
        if (!Number.isFinite(parsed.scrollTop) || parsed.scrollTop < 0) return emptyState();

        const openSections: AdminViewState["openSections"] = {};
        const storedSections = "openSections" in parsed ? parsed.openSections : null;
        if (typeof storedSections === "object" && storedSections !== null) {
            for (const sectionId of sectionIds) {
                if (sectionId in storedSections) {
                    const isOpen = (storedSections as Record<string, unknown>)[sectionId];
                    if (typeof isOpen === "boolean") openSections[sectionId] = isOpen;
                }
            }
        }

        const state = { scrollTop: parsed.scrollTop, openSections };
        memory.set(key, state);
        return state;
    } catch {
        return emptyState();
    }
};

export const saveAdminViewState = (
    userId: number | null,
    historyKey: string,
    state: AdminViewState,
) => {
    if (userId === null) return;

    const key = storageKey(userId, historyKey);
    memory.set(key, state);
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.setItem(key, JSON.stringify({ version: 1, ...state }));
    } catch {
        // In-memory history restoration remains available if storage is disabled.
    }
};
