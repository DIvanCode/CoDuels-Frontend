import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "./Header";

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    getMe: vi.fn(),
    navigate: vi.fn(),
    menuItems: [] as Array<{ label: string; onClick?: () => void }>,
    state: {
        auth: {
            token: null as string | null,
            user: null as { nickname: string } | null,
        },
    },
}));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal<typeof import("react-router-dom")>()),
    useNavigate: () => mocks.navigate,
}));

vi.mock("shared/lib/storeHooks", () => ({
    useAppDispatch: () => mocks.dispatch,
    useAppSelector: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}));

vi.mock("entities/user", () => ({
    selectCurrentUser: (state: typeof mocks.state) => state.auth.user,
    useGetMeQuery: mocks.getMe,
    UserCard: ({ user }: { user: { nickname: string } }) => <span>{user.nickname}</span>,
}));

vi.mock("features/auth", () => ({
    authActions: { logout: () => ({ type: "auth/logout" }) },
    isAdminAccessToken: (token: string | null) => token === "admin-token",
    selectAuthToken: (state: typeof mocks.state) => state.auth.token,
}));

vi.mock("features/duel-session", () => ({
    DuelInfo: () => null,
}));

vi.mock("features/theme", () => ({
    ThemeSwitch: () => <button aria-label="Переключить тему" />,
}));

vi.mock("shared/config", () => ({
    AppRoutes: {
        ADMIN: "/admin",
        AUTH: "/auth",
        GROUPS: "/groups",
        INDEX: "/",
        PROFILE: "/profile/:userNickname",
    },
}));

vi.mock("shared/ui", () => ({
    DropdownMenu: ({
        trigger,
        triggerAriaLabel,
        items,
    }: {
        trigger: ReactNode;
        triggerAriaLabel: string;
        items: typeof mocks.menuItems;
    }) => {
        mocks.menuItems = items;
        return <button aria-label={triggerAriaLabel}>{trigger}</button>;
    },
}));

const renderHeader = (path = "/") =>
    renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}>
            <Header />
        </MemoryRouter>,
    );

describe("Header authentication action", () => {
    beforeEach(() => {
        mocks.state.auth.token = null;
        mocks.state.auth.user = null;
        mocks.getMe.mockReset();
        mocks.navigate.mockReset();
        mocks.menuItems = [];
        mocks.getMe.mockReturnValue({ isError: false, isSuccess: false });
    });

    it("sends a guest to the login form", () => {
        const markup = renderHeader();

        expect(markup).toContain('href="/auth"');
        expect(markup).toContain(">Войти<");
        expect(markup).toContain('aria-label="На главную"');
    });

    it("does not repeat the login action on the auth page", () => {
        const markup = renderHeader("/auth");

        expect(markup).not.toContain('href="/auth"');
        expect(markup).not.toContain(">Войти<");
        expect(markup).toContain('aria-label="На главную"');
    });

    it("does not flash the guest action while a saved token is being checked", () => {
        mocks.state.auth.token = "saved-token";

        const markup = renderHeader();

        expect(markup).not.toContain(">Войти<");
        expect(markup).not.toContain("Открыть меню пользователя");
    });

    it("offers logout when checking a saved session fails", () => {
        mocks.state.auth.token = "saved-token";
        mocks.state.auth.user = { nickname: "DIvanCode" };
        mocks.getMe.mockReturnValue({
            isError: true,
            isSuccess: false,
            error: { status: 503 },
        });

        const markup = renderHeader();

        expect(markup).toContain(">Выйти<");
        expect(markup).not.toContain(">Войти<");
        expect(markup).not.toContain("Открыть меню пользователя");
    });

    it("keeps the existing profile menu after getMe succeeds", () => {
        mocks.state.auth.token = "valid-token";
        mocks.state.auth.user = { nickname: "DIvanCode" };
        mocks.getMe.mockReturnValue({ isError: false, isSuccess: true });

        const markup = renderHeader();

        expect(markup).toContain('aria-label="Открыть меню пользователя DIvanCode"');
        expect(markup).not.toContain(">Войти<");
        expect(mocks.menuItems.map((item) => item.label)).toEqual(["Группы", "Профиль", "Выйти"]);
    });

    it("adds an admin item after a successful admin session check", () => {
        mocks.state.auth.token = "admin-token";
        mocks.state.auth.user = { nickname: "DIvanCode" };
        mocks.getMe.mockReturnValue({ isError: false, isSuccess: true });

        renderHeader();

        expect(mocks.menuItems.map((item) => item.label)).toEqual([
            "Группы",
            "Профиль",
            "Админка",
            "Выйти",
        ]);
        mocks.menuItems.find((item) => item.label === "Админка")?.onClick?.();
        expect(mocks.navigate).toHaveBeenCalledWith("/admin");
    });

    it("does not expose the admin item while the admin session is being checked", () => {
        mocks.state.auth.token = "admin-token";
        mocks.state.auth.user = { nickname: "DIvanCode" };

        renderHeader();

        expect(mocks.menuItems).toEqual([]);
    });
});
