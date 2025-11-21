import { Layout } from "app/layout/Layout";
import { AuthPage } from "pages/auth";
import { DuelPage } from "pages/duel";
import { HomePage } from "pages/home";
import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { Fallback, Loader } from "shared/ui";

import {
    TaskInfoContent,
    TaskSubmissionsContent,
    TaskSubmissionCodeContent,
} from "widgets/task-panel";
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
            {
                path: AppRoutes.DUEL,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <DuelPage />
                        </ProtectedRoute>
                    </Suspense>
                ),
                children: [
                    {
                        index: true,
                        element: <Navigate to="description" replace />,
                    },
                    {
                        path: "description",
                        element: <TaskInfoContent />,
                    },
                    {
                        path: "submissions",
                        element: <TaskSubmissionsContent />,
                    },
                    {
                        path: "submissions/:submissionId",
                        element: <TaskSubmissionCodeContent />,
                    },
                ],
            },
        ],
        errorElement: <Fallback />,
    },
]);
