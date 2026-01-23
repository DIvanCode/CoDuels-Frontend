import { useGetMeQuery } from "entities/user";
import { selectAuthToken } from "features/auth";
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader } from "shared/ui";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
    const token = useAppSelector(selectAuthToken);

    const { isLoading, isError, isSuccess, error } = useGetMeQuery(undefined, {
        skip: !token,
    });

    const isUnauthorized =
        isError &&
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 401;

    if (token && (isLoading || (isError && !isUnauthorized))) {
        return <Loader />;
    }

    if (!token || isUnauthorized) {
        return <Navigate to={AppRoutes.AUTH} replace />;
    }

    if (isSuccess) {
        return children;
    }

    return <Loader />;
};
