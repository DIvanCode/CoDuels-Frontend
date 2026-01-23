import { PropsWithChildren } from "react";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { IconButton } from "../IconButton/IconButton";

import styles from "./Modal.module.scss";

interface Props {
    title: string;
    onClose: () => void;
    showCloseButton?: boolean;
    closeOnOverlay?: boolean;
}

export const Modal = ({
    title,
    onClose,
    showCloseButton = true,
    closeOnOverlay = true,
    children,
}: PropsWithChildren<Props>) => {
    return (
        <div
            className={styles.overlay}
            role="dialog"
            onClick={closeOnOverlay ? onClose : undefined}
        >
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                {showCloseButton && (
                    <IconButton
                        className={styles.closeButton}
                        aria-label="Закрыть"
                        onClick={onClose}
                        size="small"
                    >
                        <CrossIcon />
                    </IconButton>
                )}
                <h3 className={styles.title}>{title}</h3>
                {children}
            </div>
        </div>
    );
};
