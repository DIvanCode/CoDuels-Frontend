import styles from "./DuelResult.module.scss";

type Res = "W" | "L" | "D";

interface Props {
    winnerId: number | null;
    meId: number;
    otherId: number;
}

export const DuelResult = ({ winnerId, meId, otherId }: Props) => {
    let [me, other]: Res[] = ["D", "D"];

    if (winnerId !== null) {
        if (winnerId === meId) {
            [me, other] = ["W", "L"];
        } else if (winnerId === otherId) {
            [me, other] = ["L", "W"];
        }
    }

    const classMap: Record<Res, string> = {
        W: styles.win,
        L: styles.loss,
        D: styles.draw,
    };

    return (
        <div className={styles.result}>
            <span className={classMap[me]}>{me}</span>
            <span>-</span>
            <span className={classMap[other]}>{other}</span>
        </div>
    );
};
