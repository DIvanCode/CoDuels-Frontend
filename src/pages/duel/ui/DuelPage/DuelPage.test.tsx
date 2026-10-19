import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Duel } from "entities/duel";
import DuelPage from "./DuelPage";

const mocks = vi.hoisted(() => ({
    user: { id: 3 } as { id: number } | null,
    duel: null as Duel | null,
    getDuel: vi.fn(),
}));

vi.mock("react-split", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("entities/duel", () => ({
    useGetDuelQuery: (...args: unknown[]) => {
        mocks.getDuel(...args);
        return { data: mocks.duel, error: undefined, isLoading: false };
    },
}));
vi.mock("entities/user", () => ({ selectCurrentUser: () => mocks.user }));
vi.mock("features/auth", () => ({ selectAuthToken: () => "test-token" }));
vi.mock("features/duel-session", () => ({ selectDuelSession: () => ({ phase: "idle" }) }));
vi.mock("features/anti-cheat", () => ({ useActionsAutoFlush: () => undefined }));
vi.mock("shared/lib/storeHooks", () => ({
    useAppSelector: (selector: () => unknown) => selector(),
}));
vi.mock("shared/ui", () => ({ Loader: () => null, StatusCard: () => null }));
vi.mock("widgets/code-panel", () => ({ CodePanel: () => <div>code</div> }));
vi.mock("widgets/task-panel", () => ({ TaskPanel: () => <div>task</div> }));

const renderPage = () =>
    renderToStaticMarkup(
        <MemoryRouter initialEntries={["/duel/42"]}>
            <Routes>
                <Route path="/duel/:duelId" element={<DuelPage />} />
            </Routes>
        </MemoryRouter>,
    );

describe("observed duel polling", () => {
    beforeEach(() => {
        mocks.getDuel.mockReset();
        mocks.user = { id: 3 };
        mocks.duel = {
            id: 42,
            status: "InProgress",
            participants: [{ id: 1 }, { id: 2 }],
        } as Duel;
    });

    it("subscribes to focused two-second updates for an active observer", () => {
        renderPage();

        expect(mocks.getDuel).toHaveBeenCalledWith(42, {
            pollingInterval: 2_000,
            skipPollingIfUnfocused: true,
        });
    });

    it("stops the polling subscription for a finished duel", () => {
        mocks.duel = { ...mocks.duel!, status: "Finished" };
        renderPage();

        expect(mocks.getDuel).toHaveBeenCalledTimes(1);
    });

    it("does not add observer polling for a participant", () => {
        mocks.user = { id: 1 };
        renderPage();

        expect(mocks.getDuel).toHaveBeenCalledTimes(1);
    });

    it("does not poll an old duel snapshot during navigation", () => {
        mocks.duel = { ...mocks.duel!, id: 41 };
        renderPage();

        expect(mocks.getDuel).toHaveBeenCalledTimes(1);
    });
});
