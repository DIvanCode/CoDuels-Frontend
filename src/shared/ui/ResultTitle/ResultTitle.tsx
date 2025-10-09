import { PropsWithChildren } from "react";

import SuccessIcon from "shared/assets/icons/success.svg?react";
import FailureIcon from "shared/assets/icons/failure.svg?react";

import styles from "./ResultTitle.module.scss";

interface Props {
    variant: "success" | "failure";
}

export const ResultTitle = ({ variant, children }: PropsWithChildren<Props>) => {
    return (
        <div className={styles.resultTitle}>
            {variant === "success" ? <SuccessIcon /> : <FailureIcon />}
            {children}
        </div>
    );
};
