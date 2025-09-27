import { Link } from "react-router-dom";
import Favicon from "shared/assets/icons/favicon.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";
import { AppRoutes } from "shared/config";
import { IconButton } from "shared/ui/IconButton";

import styles from "./Header.module.scss";

export const Header = () => {
    return (
        <header className={styles.header}>
            <Link to={AppRoutes.INDEX}>
                <IconButton>
                    <Favicon />
                </IconButton>
            </Link>

            <IconButton>
                <UserIcon className={styles.userIcon} />
            </IconButton>
        </header>
    );
};
