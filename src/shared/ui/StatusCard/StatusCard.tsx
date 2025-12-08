import clsx from "clsx";

import styles from "./StatusCard.module.scss";

type StatusVariant = "info" | "success" | "warning" | "error";

interface StatusCardProps {
    variant?: StatusVariant;
    title: string;
    description?: string;
    className?: string;
}

export const StatusCard = ({
    variant = "info",
    title,
    description,
    className,
}: StatusCardProps) => {
    return (
        <div className={clsx(styles.card, styles[`card_${variant}`], className)}>
            <div className={styles.content}>
                <span className={styles.title}>{title}</span>
                {description && <p className={styles.description}>{description}</p>}
            </div>
        </div>
    );
};

export type { StatusVariant, StatusCardProps };
