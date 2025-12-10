import Arrow from "shared/assets/icons/keyboard-arrow-down.svg?react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./Select.module.scss";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps<T extends string> {
    value: T;
    options: Array<{ label: string; value: T }>;
    onChange: (value: T) => void;
    placeholder?: string;
    className?: string;
}

export const Select = <T extends string>({
    value,
    options,
    onChange,
    placeholder,
    className,
}: SelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionClick = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={clsx(styles.select, className)} ref={selectRef}>
            <div
                className={clsx(styles.trigger, isOpen && styles.open)}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.value}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className={styles.arrow}>
                    <Arrow className={styles.arrowIcon} />
                </span>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={clsx(
                                styles.option,
                                option.value === value && styles.selected,
                            )}
                            onClick={() => handleOptionClick(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
