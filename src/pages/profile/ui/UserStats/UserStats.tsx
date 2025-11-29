import { useMemo } from "react";
import { Duel, getDuelResultForUser } from "entities/duel";
import { UserData } from "entities/user";
import { AnimatedNumber } from "shared/ui";
import styles from "./UserStats.module.scss";

interface UserStatsProps {
    user: UserData;
    userDuels: Duel[];
}

export const UserStats = ({ user, userDuels }: UserStatsProps) => {
    const { rating, wins, losses, draws } = useMemo(() => {
        return userDuels.reduce(
            (acc, duel) => {
                const result = getDuelResultForUser(duel, user.id);

                if (result === "Win") acc.wins++;
                else if (result === "Lose") acc.losses++;
                else acc.draws++;

                return acc;
            },
            {
                rating: user.rating,
                wins: 0,
                losses: 0,
                draws: 0,
            },
        );
    }, [user, userDuels]);

    return (
        <table className={styles.userStatsTable}>
            <thead>
                <tr>
                    <th>Рейтинг</th>
                    <th>Победы</th>
                    <th>Поражения</th>
                    <th>Ничьи</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>
                        <AnimatedNumber value={rating} from={0} />
                    </td>
                    <td>
                        <AnimatedNumber value={wins} from={0} />
                    </td>
                    <td>
                        <AnimatedNumber value={losses} from={0} />
                    </td>
                    <td>
                        <AnimatedNumber value={draws} from={0} />
                    </td>
                </tr>
            </tbody>
        </table>
    );
};
