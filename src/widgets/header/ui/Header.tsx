import { selectCurrentUser, UserCard } from "entities/user";
import { useLogoutMutation } from "features/auth";
import { Link } from "react-router-dom";
import ExitIcon from "shared/assets/icons/exit.svg?react";
import Favicon from "shared/assets/icons/favicon.svg?react";
import ProfileIcon from "shared/assets/icons/profile.svg?react";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { IconButton, DropdownMenu } from "shared/ui";

import type { DropdownItem } from "shared/ui";
import styles from "./Header.module.scss";

export const Header = () => {
    const user = useAppSelector(selectCurrentUser);

    const [logout] = useLogoutMutation();

    const menuItems: DropdownItem[] = [
        {
            icon: <ProfileIcon />,
            label: "Профиль",
            onClick: () => {},
        },
        {
            icon: <ExitIcon />,
            label: "Выйти",
            onClick: logout,
        },
    ];

    return (
        <header className={styles.header}>
            <Link to={AppRoutes.INDEX}>
                <IconButton>
                    <Favicon />
                </IconButton>
            </Link>
            {user && <DropdownMenu trigger={<UserCard user={user} />} items={menuItems} />}
        </header>
    );
};
