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

    it("keeps page presentation and owner spacing classes on their intended elements", () => {
        const markup = renderToStaticMarkup(
            <Modal
                title="Режим дуэли"
                onClose={() => undefined}
                presentation="page"
                className="mode-panel"
                overlayClassName="mode-overlay"
            >
                <ModalText className="mode-description">Выберите режим</ModalText>
                <ModalActions grow wrap className="mode-actions">
                    <button type="button">Рейтинговая дуэль</button>
                    <button type="button">Дружеская дуэль</button>
                </ModalActions>
            </Modal>,
        );

        expect(markup).toMatch(/<div class="[^"]*mode-overlay[^"]*">/);
        expect(markup).toMatch(/<div[^>]*class="[^"]*mode-panel[^"]*"[^>]*role="dialog"/);
        expect(markup).toMatch(/<p class="[^"]*mode-description[^"]*">/);
        expect(markup).toMatch(/<div class="[^"]*mode-actions[^"]*">/);
    });

    it("uses a custom header action without duplicating the close control", () => {
        const markup = renderToStaticMarkup(
            <Modal
                title="Создать новые правила"
                onClose={() => undefined}
                headerAction={<button type="button">Закрыть</button>}
            >
                <ModalText>Настройте правила</ModalText>
            </Modal>,
        );

        expect(markup).toContain("Создать новые правила");
        expect(markup).toContain("Настройте правила");
        expect(markup).toContain("Закрыть</button>");
        expect(markup).not.toContain('aria-label="Закрыть"');
    });
});
