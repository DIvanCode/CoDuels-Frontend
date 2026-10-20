import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Modal, ModalActions, ModalText } from "./Modal";

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

    it("keeps action controls inside the dialog and supports a non-dismissable header", () => {
        const markup = renderToStaticMarkup(
            <Modal title="Соединение прервано" onClose={() => undefined} showCloseButton={false}>
                <ModalText>Повторите попытку</ModalText>
                <ModalActions align="center">
                    <button type="button">Переподключиться</button>
                </ModalActions>
            </Modal>,
        );

        expect(markup).not.toContain('aria-label="Закрыть"');
        expect(markup).toContain("Повторите попытку");
        expect(markup).toContain("Переподключиться");
        expect(markup.indexOf("Повторите попытку")).toBeLessThan(
            markup.indexOf("Переподключиться"),
        );
    });
});
