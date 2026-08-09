import { useState, type PropsWithChildren } from "react";

import styles from "./AdminPage.module.scss";

interface AdminSectionProps {
    title: string;
    count?: number;
    defaultOpen?: boolean;
}

export const AdminSection = ({
    title,
    count,
    defaultOpen = true,
    children,
}: PropsWithChildren<AdminSectionProps>) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <details
            className={styles.sectionCard}
            open={isOpen}
            onToggle={(event) => setIsOpen(event.currentTarget.open)}
        >
            <summary className={styles.sectionSummary}>
                <span className={styles.sectionTitle}>{title}</span>
                {typeof count === "number" && <span className={styles.sectionCount}>{count}</span>}
                <span className={styles.sectionChevron} aria-hidden="true" />
            </summary>
            <div className={styles.sectionContent}>{children}</div>
        </details>
    );
};
