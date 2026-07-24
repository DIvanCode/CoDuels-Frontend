import { ReactNode, useCallback, useRef, useState } from "react";
import { useDismissibleLayer } from "shared/lib/useDismissibleLayer";
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
    triggerAriaLabel?: string;
    popoverRole?: "menu" | "dialog";
}

export const DropdownMenu = ({
    trigger,
    items,
    dropdownClassName,
    triggerClassName,
    menuClassName,
    itemClassName,
    onOpenChange,
    triggerAriaLabel,
    popoverRole = "menu",
}: Props) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const closeMenu = useCallback(() => {
        setOpen(false);
        onOpenChange?.(false);
    }, [onOpenChange]);

    useDismissibleLayer({
        isOpen: open,
        layerRef: menuRef,
        onDismiss: closeMenu,
        closeOnOutsidePress: true,
    });

    const handleItemOnClick = (item: DropdownItem) => {
        item.onClick?.();
        if (item.closeOnClick !== false) {
            closeMenu();
        }
    };

    return (
        <div ref={menuRef} className={clsx(styles.dropdown, dropdownClassName)}>
            <button
                type="button"
                className={clsx(styles.dropdownTrigger, triggerClassName)}
                aria-label={triggerAriaLabel}
                aria-haspopup={popoverRole}
                aria-expanded={open}
                onClick={() => {
                    const nextOpen = !open;
                    setOpen(nextOpen);
                    onOpenChange?.(nextOpen);
                }}
            >
                {trigger}
            </button>
            {open && (
                <div
                    className={clsx(styles.dropdownMenu, menuClassName)}
                    role={popoverRole}
                    aria-label={triggerAriaLabel}
                >
                    {items.map((item, index) =>
                        item.onClick ? (
                            <button
                                key={item.id ?? index}
                                type="button"
                                role={popoverRole === "menu" ? "menuitem" : undefined}
                                className={clsx(styles.dropdownItem, itemClassName)}
                                onClick={() => handleItemOnClick(item)}
                            >
                                {item.icon && <span className={styles.listIcon}>{item.icon}</span>}
                                {item.label}
                            </button>
                        ) : (
                            <div
                                key={item.id ?? index}
                                role={popoverRole === "menu" ? "none" : undefined}
                                className={clsx(styles.dropdownItem, itemClassName)}
                            >
                                {item.icon && <span className={styles.listIcon}>{item.icon}</span>}
                                {item.label}
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
};
