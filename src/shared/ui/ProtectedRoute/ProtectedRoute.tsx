import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

interface Props {
    isAuthenticated: boolean;
}

export const ProtectedRoute = ({ isAuthenticated, children }: PropsWithChildren<Props>) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};
