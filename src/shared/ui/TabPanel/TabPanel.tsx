import { useState } from "react";

import styles from "./TabPanel.module.scss";
import { Tab } from "../Tab/Tab";

interface Props {
    tabs: string[];
    onTabChange: (index: number) => void;
}

export const TabPanel = ({ tabs, onTabChange }: Props) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        onTabChange(index);
    };

    return (
        <header className={styles.tabs}>
            {tabs.map((tabLabel, index) => (
                <Tab
                    key={tabLabel}
                    label={tabLabel}
                    onClick={() => handleClick(index)}
                    active={index === activeIndex}
                />
            ))}
        </header>
    );
};
