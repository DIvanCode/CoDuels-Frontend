import { PropsWithChildren } from "react";

import clsx from "clsx";
import styles from "./Section.module.scss";

type Props = {
    title: string;
    variant?: "primary" | "secondary";
    className?: string;
};

export const Section = ({
    children,
    title,
    className,
    variant = "primary",
}: PropsWithChildren<Props>) => {
    return (
        <section className={clsx(styles.section, className)}>
            {variant === "primary" ? <h2>{title}</h2> : <h3>{title}</h3>}
            {children}
        </section>
    );
};
