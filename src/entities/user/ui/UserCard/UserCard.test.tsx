import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UserCard } from "./UserCard";

vi.mock("shared/ui", () => ({
    AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}));

const user = {
    id: 1,
    nickname: "tourist",
    rating: 1500,
    created_at: "2026-07-24T00:00:00Z",
};

describe("UserCard", () => {
    it("uses a button only when the card has an action", () => {
        const staticMarkup = renderToStaticMarkup(<UserCard user={user} />);
        const interactiveMarkup = renderToStaticMarkup(
            <UserCard user={user} onClick={() => undefined} ariaLabel="Открыть профиль tourist" />,
        );

        expect(staticMarkup.startsWith("<span")).toBe(true);
        expect(interactiveMarkup.startsWith("<button")).toBe(true);
        expect(interactiveMarkup).toContain('aria-label="Открыть профиль tourist"');
    });
});
