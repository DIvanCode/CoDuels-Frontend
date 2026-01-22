import { selectCurrentUser, UserCard } from "entities/user";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ExitIcon from "shared/assets/icons/exit.svg?react";
import Favicon from "shared/assets/icons/favicon.svg?react";
import ProfileIcon from "shared/assets/icons/profile.svg?react";
import { AppRoutes } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { IconButton, DropdownMenu } from "shared/ui";

import type { DropdownItem } from "shared/ui";
import { DuelInfo } from "features/duel-session";
import { authActions } from "features/auth";
import { ThemeSwitch } from "features/theme";
import styles from "./Header.module.scss";

export const Header = () => {
    const { duelId } = useParams();
    const navigate = useNavigate();

    const dispatch = useAppDispatch();
    const user = useAppSelector(selectCurrentUser);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

    useEffect(() => {
        document.body.classList.toggle("user-menu-open", isUserMenuOpen);
        return () => {
            document.body.classList.remove("user-menu-open");
        };
    }, [isUserMenuOpen]);

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <Link to={AppRoutes.INDEX}>
                    <IconButton size="large">
                        <Favicon />
                    </IconButton>
                </Link>
                <ThemeSwitch />
            </div>
            <div className={styles.center}>{duelId && <DuelInfo duelId={Number(duelId)} />}</div>
            <div className={styles.right}>
                {user && (
                    <DropdownMenu
                        trigger={<UserCard user={user} hideInfo={Boolean(duelId)} />}
                        items={userMenuItems}
                        onOpenChange={setIsUserMenuOpen}
                    />
                )}
            </div>
        </header>
    );
};
