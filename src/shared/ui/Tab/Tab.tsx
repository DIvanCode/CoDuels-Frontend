import clsx from "clsx";

import styles from "./Tab.module.scss";

interface Props {
    label: string;
    onClick: () => void;
    active: boolean;
}

export const Tab = ({ label, onClick, active }: Props) => {
    return (
        <div className={clsx(styles.tab, active && styles.active)} onClick={onClick}>
            {label}
        </div>
    );
};
