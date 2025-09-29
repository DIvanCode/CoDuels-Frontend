import { Layout } from "app/layout/Layout";
import { AuthPage } from "pages/authPage";
import { HomePage } from "pages/homePage";
import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { Fallback, Loader } from "shared/ui";

import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: AppRoutes.INDEX,
        element: <Layout />,
        children: [
            {
                path: AppRoutes.AUTH,
                element: (
                    <Suspense fallback={<Loader />}>
                        <AuthPage />
                    </Suspense>
                ),
            },
            {
                index: true,
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<Loader />}>
                            <HomePage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
        ],
        errorElement: <Fallback />,
    },
]);
