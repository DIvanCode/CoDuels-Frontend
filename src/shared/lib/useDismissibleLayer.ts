import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

interface UseDismissibleLayerOptions {
    isOpen: boolean;
    layerRef: RefObject<HTMLElement | null>;
    onDismiss: () => void;
    closeOnOutsidePress?: boolean;
    focusOnOpen?: boolean;
    trapFocus?: boolean;
}

const getFocusableElements = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) =>
            !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true",
    );

export const useDismissibleLayer = ({
    isOpen,
    layerRef,
    onDismiss,
    closeOnOutsidePress = false,
    focusOnOpen = false,
    trapFocus = false,
}: UseDismissibleLayerOptions) => {
    const onDismissRef = useRef(onDismiss);

    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const layer = layerRef.current;

        if (focusOnOpen && layer) {
            const [firstFocusable] = getFocusableElements(layer);
            (firstFocusable ?? layer).focus();
        }

        const isFocusInsideLayer = () => {
            const activeElement = document.activeElement;
            return !layerRef.current || !activeElement || layerRef.current.contains(activeElement);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isFocusInsideLayer()) return;

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onDismissRef.current();
                return;
            }

            if (event.key !== "Tab" || !trapFocus || !layerRef.current) return;

            const focusableElements = getFocusableElements(layerRef.current);
            if (focusableElements.length === 0) {
                event.preventDefault();
                layerRef.current.focus();
                return;
            }

            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey && activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            } else if (!event.shiftKey && activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (!closeOnOutsidePress || !layerRef.current) return;
            if (event.target instanceof Node && !layerRef.current.contains(event.target)) {
                onDismissRef.current();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        if (closeOnOutsidePress) {
            document.addEventListener("mousedown", handleMouseDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);

            if (previouslyFocused?.isConnected) {
                previouslyFocused.focus();
            }
        };
    }, [closeOnOutsidePress, focusOnOpen, isOpen, layerRef, trapFocus]);
};
