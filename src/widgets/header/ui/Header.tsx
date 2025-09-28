import { UserCard } from "entities/user";
import { Link } from "react-router-dom";
import ExitIcon from "shared/assets/icons/exit.svg?react";
import Favicon from "shared/assets/icons/favicon.svg?react";
import ProfileIcon from "shared/assets/icons/profile.svg?react";
import { AppRoutes } from "shared/config";
import { IconButton, DropdownMenu } from "shared/ui";

import styles from "./Header.module.scss";

import type { DropdownItem } from "shared/ui";

export const Header = () => {
    const testUser = {
        username: "username",
        rating: 0,
    }; // TODO: mocked

    const menuItems: DropdownItem[] = [
        {
            icon: <ProfileIcon />,
            label: "Профиль",
            onClick: () => {},
        },
        {
            icon: <ExitIcon />,
            label: "Выйти",
            onClick: () => {},
        },
    ];

    return (
        <header className={styles.header}>
            <Link to={AppRoutes.INDEX}>
                <IconButton>
                    <Favicon />
                </IconButton>
            </Link>

            <DropdownMenu trigger={<UserCard user={testUser} />} items={menuItems} />
        </header>
    );
};
