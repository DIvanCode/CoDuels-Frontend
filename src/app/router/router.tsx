import { Layout } from "app/layout/Layout";
import { HomePage } from "pages/homePage";
import { LoginPage } from "pages/loginPage";
import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { Fallback, Loader, ProtectedRoute } from "shared/ui";

const isAuthenticated = true; // TODO: mock

export const router = createBrowserRouter([
    {
        path: AppRoutes.INDEX,
        element: <Layout />,
        children: [
            {
                path: AppRoutes.LOGIN,
                element: (
                    <Suspense fallback={<Loader />}>
                        <LoginPage />
                    </Suspense>
                ),
            },
            {
                index: true,
                element: (
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
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
