import { PropsWithChildren } from "react";

import CrossIcon from "shared/assets/icons/cross.svg?react";
import { IconButton } from "../IconButton/IconButton";

import styles from "./ResultModal.module.scss";

interface Props {
    title: string;
    onClose: () => void;
}

export const ResultModal = ({ title, onClose, children }: PropsWithChildren<Props>) => {
    return (
        <div className={styles.overlay} role="dialog" onClick={onClose}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <IconButton
                    className={styles.closeButton}
                    aria-label="Закрыть"
                    onClick={onClose}
                    size="small"
                >
                    <CrossIcon />
                </IconButton>
                <h3 className={styles.title}>{title}</h3>
                {children}
            </div>
        </div>
    );
};
