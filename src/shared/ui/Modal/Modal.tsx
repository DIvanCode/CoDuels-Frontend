import clsx from "clsx";
import { PropsWithChildren, useId, useRef, type ReactNode } from "react";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useDismissibleLayer } from "shared/lib/useDismissibleLayer";
import { IconButton } from "../IconButton/IconButton";

import styles from "./Modal.module.scss";

interface Props {
    title: string;
    onClose: () => void;
    className?: string;
    overlayClassName?: string;
    showCloseButton?: boolean;
    closeOnEscape?: boolean;
    size?: "default" | "wide";
    contentAlign?: "center" | "start";
    presentation?: "dialog" | "page";
}

export const Modal = ({
    title,
    onClose,
    className,
    overlayClassName,
    showCloseButton = true,
    closeOnEscape = true,
    size = "default",
    contentAlign = "center",
    presentation = "dialog",
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
            className={clsx(
                styles.overlay,
                presentation === "page" && styles.pageOverlay,
                overlayClassName,
            )}
        >
            <div
                ref={modalRef}
                className={clsx(
                    styles.modal,
                    size === "wide" && styles.wide,
                    contentAlign === "start" && styles.start,
                    presentation === "page" && styles.pageModal,
                    className,
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
    wrap?: boolean;
}

export const ModalActions = ({
    children,
    className,
    align = "end",
    grow = false,
    wrap = false,
}: ModalActionsProps) => (
    <div
        className={clsx(
            styles.actions,
            align === "center" ? styles.actionsCenter : styles.actionsEnd,
            grow && styles.grow,
            wrap && styles.wrap,
            className,
        )}
    >
        {children}
    </div>
);
