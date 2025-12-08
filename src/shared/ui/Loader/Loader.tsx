import clsx from "clsx";

import styles from "./Loader.module.scss";

interface LoaderProps {
    className?: string;
}

export const Loader = ({ className }: LoaderProps) => {
    return (
        <div className={clsx(styles.loaderWrapper, className)} role="status" aria-live="polite">
            <span className={styles.spinner} />
            <span className={styles.label}>Загрузка…</span>
        </div>
    );
};
