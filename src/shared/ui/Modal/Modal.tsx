import clsx from "clsx";
import { PropsWithChildren, useId, useRef, type ReactNode } from "react";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useDismissibleLayer } from "shared/lib/useDismissibleLayer";
import { IconButton } from "../IconButton/IconButton";

import styles from "./Modal.module.scss";

interface Props {
    title: string;
    onClose: () => void;
    showCloseButton?: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    size?: "default" | "wide";
    contentAlign?: "center" | "start";
}

export const Modal = ({
    title,
    onClose,
    showCloseButton = true,
    closeOnOverlay = true,
    closeOnEscape = true,
    size = "default",
    contentAlign = "center",
    children,
}: PropsWithChildren<Props>) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useDismissibleLayer({
        isOpen: true,
        layerRef: modalRef,
        onDismiss: () => {
            if (closeOnEscape) onClose();
        },
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
                className={clsx(
                    styles.modal,
                    size === "wide" && styles.wide,
                    contentAlign === "start" && styles.start,
                )}
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

interface ModalTextProps {
    children: ReactNode;
    className?: string;
    align?: "center" | "start";
}

export const ModalText = ({ children, className, align = "center" }: ModalTextProps) => (
    <p
        className={clsx(
            styles.text,
            align === "start" ? styles.textStart : styles.textCenter,
            className,
        )}
    >
        {children}
    </p>
);

interface ModalActionsProps {
    children: ReactNode;
    className?: string;
    align?: "center" | "end";
    grow?: boolean;
}

export const ModalActions = ({
    children,
    className,
    align = "end",
    grow = false,
}: ModalActionsProps) => (
    <div
        className={clsx(
            styles.actions,
            align === "center" ? styles.actionsCenter : styles.actionsEnd,
            grow && styles.grow,
            className,
        )}
    >
        {children}
    </div>
);
