import { PropsWithChildren } from "react";
import { ITab } from "../Tab/Tab";
import { TabPanel } from "../TabPanel/TabPanel";

import styles from "./TabbedCard.module.scss";

interface Props {
    tabs: ITab[];
    contentClassName?: string;
}

export const TabbedCard = ({ tabs, contentClassName, children }: PropsWithChildren<Props>) => {
    return (
        <section className={styles.tabbedCard}>
            <TabPanel tabs={tabs} tabClassName={styles.tab} />
            <div className={contentClassName}>{children}</div>
        </section>
    );
};
