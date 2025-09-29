import { selectCurrentUser } from "entities/user";
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
    const user = useAppSelector(selectCurrentUser);

    if (!user) return <Navigate to={AppRoutes.AUTH} replace />;
    return children;
};
