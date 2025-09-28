import { ReactNode, useEffect, useRef, useState } from "react";

import styles from "./DropdownMenu.module.scss";

export interface DropdownItem {
    icon: ReactNode;
    label: string;
    onClick: () => void;
}

interface Props {
    trigger: ReactNode; // Element that triggers the dropdown on click
    items: DropdownItem[];
}

export const DropdownMenu = ({ trigger, items }: Props) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleItemOnClick = (onItemClick: DropdownItem["onClick"]) => {
        onItemClick();
        setOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={menuRef} className={styles.dropdown}>
            <div className={styles.dropdownTrigger} onClick={() => setOpen(!open)}>
                {trigger}
            </div>
            {open && (
                <ul className={styles.dropdownMenu}>
                    {items.map((item) => (
                        <li
                            className={styles.dropdownItem}
                            key={item.label}
                            onClick={() => handleItemOnClick(item.onClick)}
                        >
                            {item.icon}
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
