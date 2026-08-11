import { useGetMeQuery } from "entities/user";
import { selectAuthToken } from "features/auth";
import { HomePage } from "pages/home";
import { LandingPage } from "pages/landing";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader } from "shared/ui";

import { resolveHomeRouteView } from "./homeRouteState";

export const HomeRoute = () => {
    const token = useAppSelector(selectAuthToken);
    const getMeState = useGetMeQuery(undefined, { skip: !token });
    const view = resolveHomeRouteView(token, getMeState);

    if (view === "landing") {
        return <LandingPage />;
    }

    if (view === "home") {
        return <HomePage />;
    }

    return <Loader />;
};
