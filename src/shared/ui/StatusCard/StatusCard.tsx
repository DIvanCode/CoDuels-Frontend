import clsx from "clsx";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { IconButton } from "../IconButton/IconButton";
import styles from "./StatusCard.module.scss";

type StatusVariant = "info" | "success" | "warning" | "error";

interface StatusCardProps {
    variant?: StatusVariant;
    title: string;
    description?: string;
    className?: string;
    onClose?: () => void;
    closing?: boolean;
}

export const StatusCard = ({
    variant = "info",
    title,
    description,
    className,
    onClose,
    closing = false,
}: StatusCardProps) => {
    return (
        <div
            className={clsx(
                styles.card,
                styles[`card_${variant}`],
                closing && styles.closing,
                className,
            )}
        >
            <div className={styles.content}>
                <span className={styles.title}>{title}</span>
                {description && <p className={styles.description}>{description}</p>}
            </div>
            {onClose && (
                <IconButton
                    className={styles.closeButton}
                    aria-label="Закрыть"
                    onClick={onClose}
                    size="small"
                >
                    <CrossIcon />
                </IconButton>
            )}
        </div>
    );
};

export type { StatusVariant, StatusCardProps };
