import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
    it("connects the dialog to its visible title", () => {
        const markup = renderToStaticMarkup(
            <Modal title="Подтверждение" onClose={() => undefined}>
                <button type="button">Продолжить</button>
            </Modal>,
        );

        const titleId = markup.match(/<h3 id="([^"]+)"/)?.[1];

        expect(titleId).toBeTruthy();
        expect(markup).toContain('role="dialog"');
        expect(markup).toContain('aria-modal="true"');
        expect(markup).toContain(`aria-labelledby="${titleId}"`);
    });
});
