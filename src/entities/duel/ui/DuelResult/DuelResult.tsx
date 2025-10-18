import { Duel } from "entities/duel/model/types";

import styles from "./DuelResult.module.scss";

interface Props {
    duel: Duel;
    fstUserId: string;
}

type DuelResultType = "W" | "L" | "D";

export const DuelResult = ({ duel, fstUserId }: Props) => {
    const getResult = (): [DuelResultType, DuelResultType] => {
        if (!duel.winner_user_id) return ["D", "D"];
        return duel.winner_user_id === fstUserId ? ["W", "L"] : ["L", "W"];
    };

    const getResultClassName = (result: DuelResultType) =>
        result === "W" ? styles.win : result === "L" ? styles.loss : styles.draw;

    const [fstResult, sndResult] = getResult();

    return (
        <div className={styles.result}>
            <span className={getResultClassName(fstResult)}>{fstResult}</span>
            <span>-</span>
            <span className={getResultClassName(sndResult)}>{sndResult}</span>
        </div>
    );
};
