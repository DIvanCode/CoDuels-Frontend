import { ComponentPropsWithoutRef } from "react";

import styles from "./IconButton.module.scss";

type Props = ComponentPropsWithoutRef<"button"> & { size?: "small" | "medium" | "large" };

export const IconButton = (props: Props) => {
    return (
        <button
            type="button"
            data-size={props.size ?? "medium"}
            className={styles.iconButton}
            {...props}
        />
    );
};
