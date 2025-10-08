import { Tab, type ITab } from "../Tab/Tab";
import styles from "./TabPanel.module.scss";

interface Props {
    tabs: ITab[];
    tabClassName?: string;
}

export const TabPanel = ({ tabs, tabClassName }: Props) => {
    return (
        <header className={styles.tabs}>
            {tabs.map((tab) => (
                <Tab
                    key={tab.label}
                    className={tabClassName}
                    label={tab.label}
                    trailingIcon={tab.trailingIcon}
                    active={tab.active}
                    onClick={tab.onClick}
                />
            ))}
        </header>
    );
};
