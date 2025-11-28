import { PropsWithChildren } from "react";

import styles from "./ProfileSection.module.scss";

interface Props {
    title: string;
}

export const ProfileSection = ({ title, children }: PropsWithChildren<Props>) => {
    return (
        <section className={styles.profileSection}>
            <h2 className={styles.title}>{title}</h2>
            {children}
        </section>
    );
};
