import type { ITab } from "shared/ui";
import DescriptionIcon from "shared/assets/icons/document.svg?react";
import SubmissionsIcon from "shared/assets/icons/inbox.svg?react";
import { generatePath, matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedCard } from "shared/ui";

import { AppRoutes } from "shared/config";
import styles from "./TaskPanel.module.scss";

export const TaskPanel = () => {
    const duelId = "1"; // TODO: заглушка

    const location = useLocation();
    const navigate = useNavigate();

    const tabs: ITab[] = [
        {
            label: "Описание",
            trailingIcon: <DescriptionIcon />,
            active: matchPath(AppRoutes.DUEL_TASK_DESCRIPTION, location.pathname) !== null,
            onClick: () => navigate(generatePath(AppRoutes.DUEL_TASK_DESCRIPTION, { duelId })),
        },
        {
            label: "Посылки",
            trailingIcon: <SubmissionsIcon />,
            active: matchPath(AppRoutes.DUEL_TASK_SUBMISSIONS, location.pathname) !== null,
            onClick: () => navigate(generatePath(AppRoutes.DUEL_TASK_SUBMISSIONS, { duelId })),
        },
    ];

    return (
        <TabbedCard tabs={tabs} contentClassName={styles.taskPanelContent}>
            <Outlet />
        </TabbedCard>
    );
};
