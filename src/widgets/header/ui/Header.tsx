import { selectCurrentUser, UserCard } from "entities/user";
import { Link, useNavigate, useParams } from "react-router-dom";
import ExitIcon from "shared/assets/icons/exit.svg?react";
import Favicon from "shared/assets/icons/favicon.svg?react";
import ProfileIcon from "shared/assets/icons/profile.svg?react";
import { AppRoutes } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { IconButton, DropdownMenu } from "shared/ui";

import type { DropdownItem } from "shared/ui";
import { DuelInfo } from "features/duel-session";
import { authActions } from "features/auth";
import styles from "./Header.module.scss";

export const Header = () => {
    const { duelId } = useParams();
    const navigate = useNavigate();

    const dispatch = useAppDispatch();
    const user = useAppSelector(selectCurrentUser);

    const userMenuItems: DropdownItem[] = [
        {
            icon: <ProfileIcon />,
            label: "Профиль",
            onClick: () => navigate(AppRoutes.PROFILE.replace(":userId", String(user?.id))),
        },
        {
            icon: <ExitIcon />,
            label: "Выйти",
            onClick: () => dispatch(authActions.logout()),
        },
    ];

    return (
        <header className={styles.header}>
            <Link to={AppRoutes.INDEX}>
                <IconButton>
                    <Favicon />
                </IconButton>
            </Link>
            {duelId && <DuelInfo duelId={Number(duelId)} />}
            {user && (
                <DropdownMenu
                    trigger={<UserCard user={user} hideInfo={Boolean(duelId)} />}
                    items={userMenuItems}
                />
            )}
        </header>
    );
};
