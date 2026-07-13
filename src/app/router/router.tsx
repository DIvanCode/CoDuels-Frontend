import { Layout } from "app/layout/Layout";
import { AuthPage } from "pages/auth";
import { ProfilePage } from "pages/profile";
import { DuelPage } from "pages/duel";
import { HomePage } from "pages/home";
import { GroupsPage } from "pages/groups";
import { GroupPage } from "pages/group";
import { TournamentPage } from "pages/tournament";
import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { Fallback, Loader } from "shared/ui";

import {
    TaskInfoContent,
    TaskSubmissionsContent,
    TaskSubmissionCodeContent,
} from "widgets/task-panel";
import { GroupRedirect } from "./GroupRedirect";
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
                path: AppRoutes.PROFILE,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUPS,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <GroupsPage />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUP,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <GroupRedirect />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUP_MEMBERS,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <GroupPage />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUP_DUELS,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <GroupPage />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUP_TOURNAMENTS,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <GroupPage />
                        </ProtectedRoute>
                    </Suspense>
                ),
            },
            {
                path: AppRoutes.GROUP_TOURNAMENT,
                element: (
                    <Suspense fallback={<Loader />}>
                        <ProtectedRoute>
                            <TournamentPage />
                        </ProtectedRoute>
                    </Suspense>
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
