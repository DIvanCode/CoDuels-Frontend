import React, { useState, useRef, useEffect } from "react";
import styles from "./Select.module.scss";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    value,
    options = [],
    onChange,
    placeholder = "Select...",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options?.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.select} ${className}`} ref={selectRef}>
            <div
                className={`${styles.trigger} ${isOpen ? styles.open : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.value}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className={styles.arrow}>▾</span>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {options?.map((option) => (
                        <div
                            key={option.value}
                            className={`${styles.option} ${
                                option.value === value ? styles.selected : ""
                            }`}
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
