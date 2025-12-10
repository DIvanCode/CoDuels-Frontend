import { useState } from "react";
import CopySuccessIcon from "shared/assets/icons/copy-success.svg?react";
import CopyIcon from "shared/assets/icons/copy.svg?react";
import { copyToClipboard } from "shared/lib/copyToClipboard";
import clsx from "clsx";
import { IconButton } from "../IconButton/IconButton";

import styles from "./CopyButton.module.scss";

interface Props {
    textToCopy: string;
    className?: string;
    size?: "small" | "medium";
}

export const CopyButton = ({ textToCopy, className, size = "small" }: Props) => {
    const copyIcons = {
        idleCopy: <CopyIcon className={styles.copyIdle} />,
        successCopy: <CopySuccessIcon className={styles.copySuccess} />,
    };
    const [copyIconState, setCopyIconState] = useState<keyof typeof copyIcons>("idleCopy");
    const [isCopyCoolDown, setIsCopyCoolDown] = useState(false);

    const handleCopy = async (text: string) => {
        if (isCopyCoolDown) return;

        await copyToClipboard(text);
        setCopyIconState("successCopy");
        setIsCopyCoolDown(true);
        setTimeout(() => {
            setCopyIconState("idleCopy");
            setIsCopyCoolDown(false);
        }, 1000);
    };

    return (
        <IconButton
            size={size}
            className={clsx(styles.copyButton, className)}
            onClick={() => handleCopy(textToCopy)}
        >
            {copyIcons[copyIconState]}
        </IconButton>
    );
};
