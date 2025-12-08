import type { ITab } from "shared/ui";
import DescriptionIcon from "shared/assets/icons/document.svg?react";
import SubmissionsIcon from "shared/assets/icons/inbox.svg?react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedCard } from "shared/ui";

import { AppRoutes } from "shared/config";
import styles from "./TaskPanel.module.scss";

export const TaskPanel = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs: ITab[] = [
        {
            label: "Описание",
            leadingIcon: <DescriptionIcon />,
            active: matchPath(AppRoutes.DUEL_TASK_DESCRIPTION, location.pathname) !== null,
            onClick: () => navigate("description"),
        },
        {
            label: "Посылки",
            leadingIcon: <SubmissionsIcon />,
            active:
                matchPath(AppRoutes.DUEL_TASK_SUBMISSIONS, location.pathname) !== null ||
                matchPath(AppRoutes.DUEL_TASK_SUBMISSION_CODE, location.pathname) !== null,
            onClick: () => navigate("submissions"),
        },
    ];

    return (
        <div className={styles.taskPanel}>
            <TabbedCard tabs={tabs} contentClassName={styles.taskPanelContent}>
                <Outlet />
            </TabbedCard>
        </div>
    );
};
