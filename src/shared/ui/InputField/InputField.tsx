import clsx from "clsx";
import { ComponentPropsWithoutRef } from "react";

import styles from "./InputField.module.scss";

interface Props extends ComponentPropsWithoutRef<"input"> {
    labelValue: string;
    wrapperClassName?: string;
    labelClassName?: string;
    inputClassName?: string;
}

export const InputField = ({
    labelValue,
    wrapperClassName,
    labelClassName,
    inputClassName,
    ...inputProps
}: Props) => {
    return (
        <div className={clsx(styles.inputField, wrapperClassName)}>
            <input {...inputProps} className={clsx(styles.input, inputClassName)} />

            <label htmlFor={inputProps.id} className={clsx(styles.inputLabel, labelClassName)}>
                {labelValue}
            </label>
        </div>
    );
};
