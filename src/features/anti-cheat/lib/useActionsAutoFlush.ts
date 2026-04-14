import { useEffect } from "react";
import { clearActionEventsQueue, flushActionEvents } from "./actionQueue";

const FLUSH_INTERVAL_MS = 5000;

export const useActionsAutoFlush = ({
    enabled,
    token,
    shouldSend,
}: {
    enabled: boolean;
    token: string | null;
    shouldSend: boolean;
}) => {
    useEffect(() => {
        if (!token) {
            clearActionEventsQueue();
        }
    }, [token]);

    useEffect(() => {
        if (!enabled || !token) return;

        const baseUrl = import.meta.env.VITE_BASE_URL;
        const flush = () => {
            void flushActionEvents({ baseUrl, token, shouldSend });
        };

        const intervalId = window.setInterval(flush, FLUSH_INTERVAL_MS);
        const handlePageHide = () => {
            flush();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                flush();
            }
        };

        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("beforeunload", handlePageHide);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("beforeunload", handlePageHide);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            flush();
        };
    }, [enabled, token, shouldSend]);
};
