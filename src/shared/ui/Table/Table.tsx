import { PropsWithChildren } from "react";

import clsx from "clsx";
import styles from "./Table.module.scss";

interface Props {
    className?: string;
}

export const Table = ({ className, children }: PropsWithChildren<Props>) => {
    return <table className={clsx(styles.table, className)}>{children}</table>;
};
