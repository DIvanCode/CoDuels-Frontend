import { UserBriefInfo } from "entities/user";
import { Link } from "react-router-dom";
import Favicon from "shared/assets/icons/favicon.svg?react";
import { AppRoutes } from "shared/config";
import { IconButton } from "shared/ui";

import styles from "./Header.module.scss";

export const Header = () => {
    const testUser = {
        username: "username",
        rating: 0,
    };
    return (
        <header className={styles.header}>
            <Link to={AppRoutes.INDEX}>
                <IconButton>
                    <Favicon />
                </IconButton>
            </Link>

            <UserBriefInfo user={testUser} onUserIconClick={() => console.log("TODO")} />
        </header>
    );
};
