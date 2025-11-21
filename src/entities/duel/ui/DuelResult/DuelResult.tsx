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
    const me = isResultChar(result[0]) ? result[0] : "D";
    const other = pair[me];

    return (
        <div className={styles.result}>
            <span className={classMap[other]}>{other}</span>
            <span>-</span>
            <span className={classMap[me]}>{me}</span>
        </div>
    );
};
