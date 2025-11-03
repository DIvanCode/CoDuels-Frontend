import type { DuelResultType } from "../../model/types";
import styles from "./DuelResult.module.scss";

type DuelResultChar = "W" | "L" | "D";

interface Props {
    result: DuelResultType;
}

const isResultChar = (char: string): char is DuelResultChar => ["W", "L", "D"].includes(char);

const pair: Record<DuelResultChar, DuelResultChar> = { W: "L", L: "W", D: "D" };
const classMap: Record<DuelResultChar, string> = {
    W: styles.win,
    L: styles.loss,
    D: styles.draw,
};

export const DuelResult = ({ result }: Props) => {
    const fst = isResultChar(result[0]) ? result[0] : "D";
    const snd = pair[fst];

    return (
        <div className={styles.result}>
            <span className={classMap[fst]}>{fst}</span>
            <span>-</span>
            <span className={classMap[snd]}>{snd}</span>
        </div>
    );
};
