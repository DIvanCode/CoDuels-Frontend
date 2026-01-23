import { ReactNode, useEffect, useRef, useState } from "react";
import { assertIsNode } from "shared/lib/typeAssertions";
import clsx from "clsx";

import styles from "./DropdownMenu.module.scss";

export interface DropdownItem {
    id?: string | number;
    icon?: ReactNode;
    label: ReactNode;
    onClick?: () => void;
    closeOnClick?: boolean;
}

interface Props {
    trigger: ReactNode; // Element that triggers the dropdown on click
    items: DropdownItem[];
    dropdownClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    itemClassName?: string;
    onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu = ({
    trigger,
    items,
    dropdownClassName,
    triggerClassName,
    menuClassName,
    itemClassName,
    onOpenChange,
}: Props) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleItemOnClick = (item: DropdownItem) => {
        item.onClick?.();
        if (item.closeOnClick !== false) {
            setOpen(false);
        }
    };

    const handleClickOutside = ({ target }: MouseEvent) => {
        assertIsNode(target);
        if (menuRef.current && !menuRef.current.contains(target)) {
            setOpen(false);
            onOpenChange?.(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={menuRef} className={clsx(styles.dropdown, dropdownClassName)}>
            <div
                className={clsx(styles.dropdownTrigger, triggerClassName)}
                onClick={() => {
                    const nextOpen = !open;
                    setOpen(nextOpen);
                    onOpenChange?.(nextOpen);
                }}
            >
                {trigger}
            </div>
            {open && (
                <ul className={clsx(styles.dropdownMenu, menuClassName)}>
                    {items.map((item, index) => (
                        <li
                            className={clsx(styles.dropdownItem, itemClassName)}
                            key={item.id ?? index}
                            onClick={() => handleItemOnClick(item)}
                        >
                            {item.icon && <span className={styles.listIcon}>{item.icon}</span>}
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
