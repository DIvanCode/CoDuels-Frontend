import { selectCurrentUser, UserCard, useGetMeQuery } from "entities/user";
import clsx from "clsx";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ExitIcon from "shared/assets/icons/exit.svg?react";
import Favicon from "shared/assets/icons/favicon.svg?react";
import GroupIcon from "shared/assets/icons/group.svg?react";
import ProfileIcon from "shared/assets/icons/profile.svg?react";
import { AppRoutes } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { DropdownMenu } from "shared/ui";

import type { DropdownItem } from "shared/ui";
import { DuelInfo } from "features/duel-session";
import { authActions, selectAuthToken } from "features/auth";
import { ThemeSwitch } from "features/theme";
import styles from "./Header.module.scss";

export const Header = () => {
    const { duelId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const dispatch = useAppDispatch();
    const user = useAppSelector(selectCurrentUser);
    const token = useAppSelector(selectAuthToken);
    const { isError, isSuccess, error } = useGetMeQuery(undefined, { skip: !token });
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const isUnauthorized =
        isError &&
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 401;
    const showUserMenu = Boolean(token && isSuccess && user);
    const isAuthRoute =
        location.pathname === AppRoutes.AUTH || location.pathname.startsWith(`${AppRoutes.AUTH}/`);
    const showLogin = (!token || isUnauthorized) && !isAuthRoute;
    const showSessionRecovery = Boolean(token && isError && !isUnauthorized);
    const showLanding = location.pathname === AppRoutes.INDEX && showLogin;

    const userMenuItems: DropdownItem[] = [
        {
            icon: <GroupIcon />,
            label: "Группы",
            onClick: () => navigate(AppRoutes.GROUPS),
        },
        {
            icon: <ProfileIcon />,
            label: "Профиль",
            onClick: () =>
                navigate(AppRoutes.PROFILE.replace(":userNickname", String(user?.nickname))),
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
        <header className={clsx(styles.header, showLanding && styles.landingHeader)}>
            <div className={styles.left}>
                <Link className={styles.logoLink} to={AppRoutes.INDEX} aria-label="На главную">
                    <Favicon />
                </Link>
                <ThemeSwitch />
            </div>
            <div className={styles.center}>{duelId && <DuelInfo duelId={Number(duelId)} />}</div>
            <div className={styles.right}>
                {showUserMenu && user && (
                    <DropdownMenu
                        trigger={
                            <UserCard user={user} hideInfo={Boolean(duelId)} compactOnMobile />
                        }
                        items={userMenuItems}
                        onOpenChange={setIsUserMenuOpen}
                        triggerClassName={styles.userMenuTrigger}
                        triggerAriaLabel={`Открыть меню пользователя ${user.nickname}`}
                    />
                )}
                {showLogin && (
                    <Link className={styles.loginLink} to={AppRoutes.AUTH}>
                        Войти
                    </Link>
                )}
                {showSessionRecovery && (
                    <button
                        className={styles.loginLink}
                        type="button"
                        onClick={() => dispatch(authActions.logout())}
                    >
                        Выйти
                    </button>
                )}
            </div>
        </header>
    );
};
