import clsx from "clsx";
import { DuelSessionManager } from "features/duel-session";
import { RouterProvider } from "react-router-dom";
import { useAppSelector } from "shared/lib/storeHooks";
import { selectThemeMode } from "features/theme";

import { router } from "./router";

export const AppRouter = () => {
    const theme = useAppSelector(selectThemeMode);

    return (
        <div className={clsx("app", `app--${theme}`)} data-theme={theme}>
            <DuelSessionManager />
            <RouterProvider router={router} />
        </div>
    );
};
