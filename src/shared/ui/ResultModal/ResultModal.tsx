import { ReactNode, useId } from "react";

import { IconButton } from "../IconButton/IconButton";
import CrossIcon from "shared/assets/icons/cross.svg?react";

import styles from "./ResultModal.module.scss";

interface Props {
    title: string;
    description?: string | null;
    onClose: () => void;
    children?: ReactNode;
    ariaLive?: "off" | "polite" | "assertive";
}

export const ResultModal = ({
    title,
    description,
    onClose,
    children,
    ariaLive = "assertive",
}: Props) => {
    const titleId = useId();

    return (
        <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-live={ariaLive}
            aria-labelledby={titleId}
            onClick={onClose}
        >
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <IconButton
                    className={styles.closeButton}
                    aria-label="Закрыть"
                    onClick={onClose}
                    size="small"
                >
                    <CrossIcon />
                </IconButton>
                <h3 id={titleId} className={styles.title}>
                    {title}
                </h3>
                {description && <p className={styles.description}>{description}</p>}
                {children}
            </div>
        </div>
    );
};
