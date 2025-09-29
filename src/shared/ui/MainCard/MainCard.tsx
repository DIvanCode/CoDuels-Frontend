import clsx from "clsx";
import { PropsWithChildren } from "react";

import styles from "./MainCard.module.scss";

interface Props {
    className?: string;
}

export const MainCard = ({ className, children }: PropsWithChildren<Props>) => {
    return <section className={clsx(styles.mainCard, className)}>{children}</section>;
};
