import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    AppRoutes: { INDEX: "/" },
    fromApiLanguage: vi.fn(),
    LANGUAGE_LABELS: {},
}));

vi.mock("shared/ui", () => ({
    Loader: () => null,
    Table: () => null,
}));

vi.mock("entities/user", () => ({
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
});
