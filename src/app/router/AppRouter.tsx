import { RouterProvider } from "react-router-dom";

import { router } from "./router";

// NOTE: Эта компонента пока голая, но именно здесь мы будем оборачивать роутер в див с темой, которую будем использовать
// NOTE: для конкатенации классов использовать clsx
export const AppRouter = () => {
    return (
        <div className="app">
            <RouterProvider router={router} />
        </div>
    );
};
