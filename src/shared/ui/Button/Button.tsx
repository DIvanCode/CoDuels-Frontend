import clsx from "clsx";
import { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./Button.module.scss";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
    variant?: "filled" | "outlined";
    leadingIcon?: ReactNode;
    children: ReactNode;
}

export const Button = ({
    variant = "filled",
    leadingIcon,
    className,
    disabled,
    type = "button",
    children,
    ...props
}: ButtonProps) => {
    return (
        <button
            // eslint-disable-next-line react-dom/no-missing-button-type
            type={type}
            className={clsx(styles.button, styles[variant], disabled && styles.disabled, className)}
            disabled={disabled}
            {...props}
        >
            {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
            <span className={styles.buttonText}>{children}</span>
        </button>
    );
};
