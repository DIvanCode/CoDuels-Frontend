import { PropsWithChildren } from "react";

import { clsx } from "clsx";
import styles from "./Badge.module.scss";

interface Props {
    severity: "warning"; // NOTE: можно будет расширить в будущем
}

export const Badge = ({ severity, children }: PropsWithChildren<Props>) => {
    return <span className={clsx(styles.badge, styles[severity])}>{children}</span>;
};
