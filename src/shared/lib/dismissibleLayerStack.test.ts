import { describe, expect, it } from "vitest";

import { createDismissibleLayerStack } from "./dismissibleLayerStack";

describe("dismissibleLayerStack", () => {
    it("allows only the most recently opened layer to handle dismissal", () => {
        const stack = createDismissibleLayerStack();
        const parent = stack.register();
        const child = stack.register();

        expect(parent.isTopmost()).toBe(false);
        expect(child.isTopmost()).toBe(true);

        child.unregister();

        expect(child.isTopmost()).toBe(false);
        expect(parent.isTopmost()).toBe(true);
    });

    it("removes a non-topmost layer without disturbing the active child", () => {
        const stack = createDismissibleLayerStack();
        const parent = stack.register();
        const child = stack.register();

        parent.unregister();
        parent.unregister();

        expect(parent.isTopmost()).toBe(false);
        expect(child.isTopmost()).toBe(true);
    });
});
