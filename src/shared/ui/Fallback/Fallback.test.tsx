import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Fallback } from "./Fallback";

describe("Fallback", () => {
    it("renders without a router context", () => {
        const markup = renderToStaticMarkup(<Fallback />);

        expect(markup).toContain('role="alert"');
        expect(markup).toContain('href="/"');
    });
});
