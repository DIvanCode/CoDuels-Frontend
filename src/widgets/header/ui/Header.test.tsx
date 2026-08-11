import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "./Header";

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    getMe: vi.fn(),
    state: {
        auth: {
            token: null as string | null,
            user: null as { nickname: string } | null,
        },
    },
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
    }: {
        trigger: ReactNode;
        triggerAriaLabel: string;
    }) => <button aria-label={triggerAriaLabel}>{trigger}</button>,
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
    });
});
