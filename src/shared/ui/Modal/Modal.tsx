import { PropsWithChildren, useId, useRef } from "react";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useDismissibleLayer } from "shared/lib/useDismissibleLayer";
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
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useDismissibleLayer({
        isOpen: true,
        layerRef: modalRef,
        onDismiss: onClose,
        focusOnOpen: true,
        trapFocus: true,
    });

    return (
        <div
            className={styles.overlay}
            onClick={(event) => {
                if (closeOnOverlay && event.currentTarget === event.target) {
                    onClose();
                }
            }}
        >
            <div
                ref={modalRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
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
                <h3 id={titleId} className={styles.title}>
                    {title}
                </h3>
                {children}
            </div>
        </div>
    );
};
