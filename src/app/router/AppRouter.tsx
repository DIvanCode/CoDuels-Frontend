import { RouterProvider } from "react-router-dom";
import clsx from "clsx";
import { useAppSelector } from "shared/lib/storeHooks";
import { selectThemeMode } from "features/theme";

import { router } from "./router";

// NOTE: Эта компонента пока голая, но именно здесь мы будем оборачивать роутер в див с темой, которую будем использовать
// NOTE: для конкатенации классов использовать clsx
export const AppRouter = () => {
    const theme = useAppSelector(selectThemeMode);

    return (
        <div className={clsx("app", `app--${theme}`)} data-theme={theme}>
            <RouterProvider router={router} />
        </div>
    );
};
