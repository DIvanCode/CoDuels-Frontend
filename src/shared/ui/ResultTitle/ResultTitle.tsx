import { PropsWithChildren } from "react";

import SuccessIcon from "shared/assets/icons/success.svg?react";
import FailureIcon from "shared/assets/icons/failure.svg?react";
import TestingIcon from "shared/assets/icons/testing.svg?react";

import styles from "./ResultTitle.module.scss";

interface Props {
    variant: "success" | "failure" | "testing";
}

export const ResultTitle = ({ variant, children }: PropsWithChildren<Props>) => {
    const getIcon = () => {
        switch (variant) {
            case "success":
                return <SuccessIcon />;
            case "failure":
                return <FailureIcon />;
            case "testing":
                return <TestingIcon />;
            default:
                return <FailureIcon />;
        }
    };

    const getClassName = () => {
        const baseClass = styles.resultTitle;
        const variantClass =
            variant === "testing" ? styles.testing : variant === "success" ? styles.success : "";
        return `${baseClass} ${variantClass}`.trim();
    };

    return (
        <div className={getClassName()}>
            {getIcon()}
            {children}
        </div>
    );
};
