import clsx from "clsx";
import { useEffect } from "react";
import {
    matchPath,
    Outlet,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import { useDuelTaskSelection, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import DescriptionIcon from "shared/assets/icons/document.svg?react";
import SubmissionsIcon from "shared/assets/icons/inbox.svg?react";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import type { ITab } from "shared/ui";
import { Button, TabbedCard } from "shared/ui";
import styles from "./TaskPanel.module.scss";

export const TaskPanel = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { duelId } = useParams();
    const { data: duel } = useGetDuelQuery(duelId ? Number(duelId) : NaN, {
        skip: !duelId,
    });
    const currentUser = useAppSelector(selectCurrentUser);
    const [searchParams] = useSearchParams();
    const { tasks, selectedTaskKey } = useDuelTaskSelection(duel);
    const selectedTaskValue = selectedTaskKey ?? tasks[0]?.key ?? "";
    const showTaskSelect = tasks.length > 0 && Boolean(selectedTaskValue);
    const isParticipant = (duel?.participants ?? []).some(
        (participant) => participant.id === currentUser?.id,
    );
    const isSubmissionsRoute =
        matchPath(AppRoutes.DUEL_TASK_SUBMISSIONS, location.pathname) !== null ||
        matchPath(AppRoutes.DUEL_TASK_SUBMISSION_CODE, location.pathname) !== null;

    useEffect(() => {
        if (duel && !isParticipant && isSubmissionsRoute) {
            navigate({ pathname: "description", search: location.search }, { replace: true });
        }
    }, [duel, isParticipant, isSubmissionsRoute, location.search, navigate]);

    const tabs: ITab[] = [
        {
            label: "Условие",
            leadingIcon: <DescriptionIcon />,
            active: matchPath(AppRoutes.DUEL_TASK_DESCRIPTION, location.pathname) !== null,
            onClick: () => navigate({ pathname: "description", search: location.search }),
        },
    ];

    if (isParticipant) {
        tabs.push({
            label: "Посылки",
            leadingIcon: <SubmissionsIcon />,
            active: isSubmissionsRoute,
            onClick: () => navigate({ pathname: "submissions", search: location.search }),
        });
    }

    return (
        <div className={styles.taskPanel}>
            {showTaskSelect ? (
                <div className={styles.taskPicker}>
                    <span className={styles.taskLabel}>Задача</span>
                    <div className={styles.taskButtons}>
                        {tasks.map((task) => (
                            <Button
                                key={task.key}
                                variant="outlined"
                                className={clsx(
                                    styles.taskButton,
                                    selectedTaskValue === task.key && styles.taskButtonActive,
                                )}
                                onClick={() => {
                                    const nextParams = new URLSearchParams(searchParams);
                                    nextParams.set("task", task.key);
                                    navigate({
                                        pathname: "description",
                                        search: nextParams.toString(),
                                    });
                                }}
                            >
                                {task.key}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}
            <TabbedCard tabs={tabs} contentClassName={styles.taskPanelContent}>
                <Outlet />
            </TabbedCard>
        </div>
    );
};
