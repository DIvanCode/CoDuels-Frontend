import clsx from "clsx";
import { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./SubmitButton.module.scss";

interface SubmitButtonProps extends ComponentPropsWithoutRef<"button"> {
    variant?: "filled" | "outlined";
    leadingIcon?: ReactNode;
    children: ReactNode;
}

export const SubmitButton = ({
    variant = "filled",
    leadingIcon,
    className,
    disabled,
    children,
    ...props
}: SubmitButtonProps) => {
    return (
        <button
            type="submit"
            className={clsx(
                styles.submitButton,
                styles[variant],
                disabled && styles.disabled,
                className,
            )}
            disabled={disabled}
            {...props}
        >
            {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
            <span className={styles.buttonText}>{children}</span>
        </button>
    );
};
