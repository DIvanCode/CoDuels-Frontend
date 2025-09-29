import { ComponentPropsWithoutRef } from "react";

import styles from "./InputField.module.scss";

interface Props extends ComponentPropsWithoutRef<"input"> {
    labelValue: string;
}

export const InputField = ({ labelValue, ...inputProps }: Props) => {
    return (
        <div className={styles.inputField}>
            <input {...inputProps} className={styles.input} />

            <label htmlFor={inputProps.id} className={styles.inputLabel}>
                {labelValue}
            </label>
        </div>
    );
};
