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
        expect(markup).not.toContain(">Войти<");
    });

    it("renders the duel demonstration without interactive application widgets", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        );

        expect(markup).toContain("DIvanCode");
        expect(markup).toContain("nightCoder");
        expect(markup).toContain("10:31");
        expect(markup).toContain("Минимум на отрезке");
    });
});
