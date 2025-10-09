import type { ITab } from "shared/ui";
import { TabbedCard } from "shared/ui";
import CodeIcon from "shared/assets/icons/code.svg?react";

import styles from "./CodePanel.module.scss";

export const CodePanel = () => {
    const leftTabs: ITab[] = [
        {
            label: "Код",
            leadingIcon: <CodeIcon />,
            active: true,
        },
    ];

    return (
        <TabbedCard tabs={leftTabs} contentClassName={styles.codePanelContent}>
            <p>Code</p>
        </TabbedCard>
    );
};
