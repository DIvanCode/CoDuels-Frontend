import DuelIcon from "shared/assets/icons/crossed-swords.svg?react";
import { useTimer } from "react-timer-hook";

import styles from "./ActiveDuelTimer.module.scss";

interface Props {
    expiryTimestamp: Date;
}

export const ActiveDuelTimer = ({ expiryTimestamp }: Props) => {
    const { seconds, minutes } = useTimer({ expiryTimestamp });

    return (
        <div className={styles.activeDuelTimer}>
            <DuelIcon className={styles.duelIcon} />
            <p className={styles.time}>
                {`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}
            </p>
        </div>
    );
};
