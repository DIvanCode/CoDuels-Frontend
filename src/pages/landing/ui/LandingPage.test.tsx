import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { LandingPage } from "./LandingPage";

vi.mock("shared/config", () => ({
    AppRoutes: { AUTH: "/auth" },
}));

describe("LandingPage", () => {
    it("links the primary CTA directly to the registration tab", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        );

        expect(markup).toContain("ДУЭЛЬ НАЧИНАЕТСЯ ЗДЕСЬ");
        expect(markup).toContain('href="/auth?tab=register"');
        expect(markup).toContain("Хочу участвовать!");
        expect(markup).toContain("Регистрируйся — и ты в игре");
        expect(markup).toContain("Реши задачу");
        expect(markup).not.toContain(">Войти<");
    });

    it("renders the duel demonstration as theme-specific images", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        );

        expect(markup).toContain('role="img"');
        expect(markup).toContain('aria-label="Демонстрация экрана дуэли"');
        expect(markup.match(/<img /g)).toHaveLength(2);
        expect(markup).not.toContain("Редактор кода");
    });
});
