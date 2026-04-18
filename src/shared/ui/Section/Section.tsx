import { PropsWithChildren, ReactNode } from "react";

import clsx from "clsx";
import styles from "./Section.module.scss";

type Props = {
    title: string;
    variant?: "primary" | "secondary";
    className?: string;
    titleAction?: ReactNode;
    titleActionPosition?: "right" | "inline";
};

export const Section = ({
    children,
    title,
    className,
    titleAction,
    titleActionPosition = "right",
    variant = "primary",
}: PropsWithChildren<Props>) => {
    return (
        <section className={clsx(styles.section, className)}>
            <div
                className={clsx(
                    styles.sectionHeader,
                    titleActionPosition === "inline" && styles.sectionHeaderInline,
                )}
            >
                {variant === "primary" ? <h2>{title}</h2> : <h3>{title}</h3>}
                {titleAction}
            </div>
            {children}
        </section>
    );
};
