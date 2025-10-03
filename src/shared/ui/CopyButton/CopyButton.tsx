import { useState } from "react";
import CopySuccessIcon from "shared/assets/icons/copy-success.svg?react";
import CopyIcon from "shared/assets/icons/copy.svg?react";
import { copyToClipboard } from "shared/lib/copyToClipboard";
import { IconButton } from "../IconButton/IconButton";

import styles from "./CopyButton.module.scss";

interface Props {
    textToCopy: string;
}

export const CopyButton = ({ textToCopy }: Props) => {
    const copyIcons = {
        idleCopy: <CopyIcon />,
        successCopy: <CopySuccessIcon />,
    };
    const [copyIconState, setCopyIconState] = useState<keyof typeof copyIcons>("idleCopy");
    const [isCopyCoolDown, setIsCopyCoolDown] = useState(false);

    const handleCopy = async (text: string) => {
        if (isCopyCoolDown) return;

        try {
            await copyToClipboard(text);
            setCopyIconState("successCopy");
            setIsCopyCoolDown(true);
            setTimeout(() => {
                setCopyIconState("idleCopy");
                setIsCopyCoolDown(false);
            }, 1000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <IconButton
            size="small"
            className={styles.copyButton}
            onClick={() => handleCopy(textToCopy)}
        >
            {copyIcons[copyIconState]}
        </IconButton>
    );
};
