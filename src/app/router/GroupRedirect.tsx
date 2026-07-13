import { useParams, Navigate } from "react-router-dom";
import { AppRoutes } from "shared/config";

export const GroupRedirect = () => {
    const { groupId } = useParams();

    if (!groupId) {
        return <Navigate to={AppRoutes.GROUPS} replace />;
    }

    return <Navigate to={AppRoutes.GROUP_MEMBERS.replace(":groupId", groupId)} replace />;
};
