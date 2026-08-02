import { describe, expect, it } from "vitest";

import { getFriendlyDuelCreationError } from "./creationError";

describe("friendly duel creation errors", () => {
    it("explains that the opponent nickname was not found for a 404 response", () => {
        expect(getFriendlyDuelCreationError({ status: 404 })).toEqual({
            title: "Не получилось отправить вызов на дуэль",
            description: "Не найден соперник с таким никнеймом",
        });
    });
});
