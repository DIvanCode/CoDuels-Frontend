import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

type Props = {
    isAuthenticated: boolean;
};

export const ProtectedRoute = ({ isAuthenticated, children }: PropsWithChildren<Props>) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};
