import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DropdownMenu } from "./DropdownMenu";

describe("DropdownMenu", () => {
    it("renders a semantic keyboard-focusable popover trigger", () => {
        const markup = renderToStaticMarkup(
            <DropdownMenu
                trigger={<span>Профиль</span>}
                triggerAriaLabel="Открыть меню пользователя"
                items={[{ label: "Выйти", onClick: () => undefined }]}
            />,
        );

        expect(markup).toContain("<button");
        expect(markup).toContain('aria-label="Открыть меню пользователя"');
        expect(markup).toContain('aria-haspopup="menu"');
        expect(markup).toContain('aria-expanded="false"');
    });
});
