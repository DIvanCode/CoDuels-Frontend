import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatAdminDateTime } from "../lib/adminPageHelpers";
import { AdminPage } from "./AdminPage";

const mocks = vi.hoisted(() => ({
    token: "user-token" as string | null,
    adminQuery: vi.fn<
        (
            arg: unknown,
            options: { skip: boolean },
        ) => {
            data: never[];
            error: unknown;
            isError: boolean;
            isLoading: boolean;
        }
    >(() => ({
        data: [],
        error: undefined as unknown,
        isError: false,
        isLoading: false,
    })),
}));

vi.mock("shared/lib/storeHooks", () => ({
    useAppSelector: () => mocks.token,
}));

vi.mock("features/auth", () => ({
    selectAuthToken: vi.fn(),
    isAdminAccessToken: (token: string | null) => token === "admin-token",
}));

vi.mock("shared/config", () => ({
    AppRoutes: { INDEX: "/", PROFILE: "/profile/:userNickname" },
    fromApiLanguage: vi.fn(),
    LANGUAGE_LABELS: {},
}));

vi.mock("shared/ui", () => ({
    Loader: () => null,
    Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
}));

vi.mock("entities/user", () => ({
    selectCurrentUser: vi.fn(),
    useGetAdminUsersQuery: mocks.adminQuery,
    useGetAdminActiveUsersQuery: mocks.adminQuery,
}));

vi.mock("entities/duel", () => ({
    useGetAdminPendingDuelsQuery: mocks.adminQuery,
    useGetAdminRankedDuelSearchersQuery: mocks.adminQuery,
    useGetAdminActiveDuelsQuery: mocks.adminQuery,
    useGetAdminFinishedDuelsQuery: mocks.adminQuery,
}));

vi.mock("entities/submission", () => ({
    useGetAdminTestingSubmissionsQuery: mocks.adminQuery,
    useGetAdminSubmissionsQuery: mocks.adminQuery,
}));

vi.mock("entities/group", () => ({
    useGetAdminGroupsQuery: mocks.adminQuery,
}));

vi.mock("entities/tournament", () => ({
    useGetAdminActiveTournamentsQuery: mocks.adminQuery,
    useGetAdminFinishedTournamentsQuery: mocks.adminQuery,
}));

const renderAdminPage = () =>
    renderToStaticMarkup(
        <MemoryRouter initialEntries={["/admin"]}>
            <AdminPage />
        </MemoryRouter>,
    );

describe("AdminPage access handling", () => {
    beforeEach(() => {
        mocks.token = "user-token";
        mocks.adminQuery.mockReset();
        mocks.adminQuery.mockImplementation(() => ({
            data: [],
            error: undefined,
            isError: false,
            isLoading: false,
        }));
    });

    it("shows a neutral page and skips admin requests for a non-admin", () => {
        const markup = renderAdminPage();

        expect(markup).toContain("Страница не найдена");
        expect(markup).not.toContain("Административная панель");
        expect(mocks.adminQuery).toHaveBeenCalledTimes(11);
        expect(mocks.adminQuery.mock.calls.every((call) => call[1].skip)).toBe(true);
    });

    it("shows a neutral page when the backend rejects an admin request", () => {
        mocks.token = "admin-token";
        mocks.adminQuery.mockImplementationOnce(() => ({
            data: [],
            error: { status: 403 },
            isError: true,
            isLoading: false,
        }));

        const markup = renderAdminPage();

        expect(markup).toContain("Страница не найдена");
        expect(markup).not.toContain("Административная панель");
        expect(mocks.adminQuery.mock.calls.every((call) => !call[1].skip)).toBe(true);
    });

    it("shows saved presence and online status in both user tables", () => {
        mocks.token = "admin-token";
        const lastSeenAt = "2026-10-16T10:30:00Z";
        const onlineUser = {
            id: 1,
            nickname: "online-user",
            rating: 1500,
            created_at: "2026-10-01T10:00:00Z",
            last_seen_at: lastSeenAt,
        };
        const offlineUser = {
            id: 2,
            nickname: "offline-user",
            rating: 1500,
            created_at: "2026-10-01T10:00:00Z",
            last_seen_at: null,
        };
        const emptyResult = { data: [], error: undefined, isError: false, isLoading: false };
        mocks.adminQuery.mockImplementationOnce(() => ({
            ...emptyResult,
            data: [onlineUser, offlineUser] as never[],
        }));
        mocks.adminQuery.mockImplementationOnce(() => ({
            ...emptyResult,
            data: [onlineUser] as never[],
        }));

        const markup = renderAdminPage();

        expect(markup.match(/Последнее появление/g)).toHaveLength(2);
        expect(markup).toContain(formatAdminDateTime(lastSeenAt));
        expect(markup).toContain("<td>—</td>");
        expect(markup).toContain("Онлайн");
        expect(markup).toContain("Не в сети");
    });
});
