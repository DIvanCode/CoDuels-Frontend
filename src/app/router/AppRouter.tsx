import { RouterProvider } from "react-router-dom";

import { router } from "./router";

// NOTE: Эта компонента пока голая, но именно здесь мы будем оборачивать роутер в див с темой, которую будем использовать
export const AppRouter = () => {
    return <RouterProvider router={router} />;
};
