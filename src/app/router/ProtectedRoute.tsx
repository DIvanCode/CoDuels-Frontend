import { useGetMeQuery } from "entities/user";
import { selectAuthToken } from "features/auth";
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader } from "shared/ui";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
    const token = useAppSelector(selectAuthToken);

    const { isLoading, isError, isSuccess } = useGetMeQuery(undefined, {
        skip: !token,
    });

    if (token && isLoading) {
        return <Loader />;
    }

    if (!token || isError) {
        return <Navigate to={AppRoutes.AUTH} replace />;
    }

    if (isSuccess) {
        return children;
    }

    return <Navigate to={AppRoutes.AUTH} replace />;
};
