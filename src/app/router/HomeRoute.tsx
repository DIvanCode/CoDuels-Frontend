import { useGetMeQuery } from "entities/user";
import { isAdminAccessToken, selectAuthToken } from "features/auth";
import { HomePage } from "pages/home";
import { LandingPage } from "pages/landing";
import { Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader } from "shared/ui";

import { resolveHomeRouteView } from "./homeRouteState";

export const HomeRoute = () => {
    const token = useAppSelector(selectAuthToken);
    const getMeState = useGetMeQuery(undefined, { skip: !token });
    const view = resolveHomeRouteView(token, getMeState, isAdminAccessToken(token));

    if (view === "landing") {
        return <LandingPage />;
    }

    if (view === "home") {
        return <HomePage />;
    }

    if (view === "admin") {
        return <Navigate to={AppRoutes.ADMIN} replace />;
    }

    return <Loader />;
};
