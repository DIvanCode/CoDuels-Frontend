import clsx from "clsx";

import { ReactNode } from "react";
import styles from "./Tab.module.scss";

export interface ITab {
    label: string;
    active: boolean;
    onClick?: () => void;
    leadingIcon?: ReactNode;
    className?: string;
}

export const Tab = ({ label, active, onClick, leadingIcon, className }: ITab) => {
    return (
        <div className={clsx(styles.tab, active && styles.active, className)} onClick={onClick}>
            {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
            {label}
        </div>
    );
};
