import { ComponentPropsWithoutRef } from "react";

import clsx from "clsx";
import styles from "./IconButton.module.scss";

interface Props extends ComponentPropsWithoutRef<"button"> {
    size?: "small" | "medium" | "large";
}

export const IconButton = ({ className, ...props }: Props) => {
    return (
        <button
            type="button"
            data-size={props.size ?? "medium"}
            className={clsx(className, styles.iconButton)}
            {...props}
        />
    );
};
