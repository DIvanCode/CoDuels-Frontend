import clsx from "clsx";
import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { IconButton } from "shared/ui";

import SunIcon from "shared/assets/icons/sun.svg?react";
import MoonIcon from "shared/assets/icons/moon.svg?react";

import { themeActions } from "../../model/themeSlice";
import { selectThemeMode } from "../../model/selectors";

import styles from "./ThemeSwitch.module.scss";

export const ThemeSwitch = () => {
    const dispatch = useAppDispatch();
    const theme = useAppSelector(selectThemeMode);

    const isLight = theme === "light";

    const handleToggle = useCallback(() => {
        dispatch(themeActions.toggleTheme());
    }, [dispatch]);

    return (
        <IconButton
            className={clsx(styles.button, isLight ? styles.buttonLight : styles.buttonDark)}
            aria-pressed={isLight}
            aria-label={isLight ? "Включена светлая тема" : "Включена тёмная тема"}
            title={isLight ? "Светлая тема" : "Тёмная тема"}
            onClick={handleToggle}
        >
            {isLight ? (
                <SunIcon className={clsx(styles.icon, styles.iconLight)} />
            ) : (
                <MoonIcon className={clsx(styles.icon, styles.iconDark)} />
            )}
        </IconButton>
    );
};
