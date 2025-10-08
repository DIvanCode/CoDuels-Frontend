import clsx from "clsx";

import { ReactNode } from "react";
import styles from "./Tab.module.scss";

export interface ITab {
    label: string;
    active: boolean;
    onClick: () => void;
    trailingIcon?: ReactNode;
    className?: string;
}

export const Tab = ({ label, active, onClick, trailingIcon, className }: ITab) => {
    return (
        <div className={clsx(styles.tab, active && styles.active, className)} onClick={onClick}>
            {trailingIcon && <span className={styles.TrailingIcon}>{trailingIcon}</span>}
            {label}
        </div>
    );
};
