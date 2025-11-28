import { DuelResult, useGetDuelQuery, type DuelResultType } from "entities/duel";
import { selectCurrentUser, UserCard } from "entities/user";
import { useAppSelector } from "shared/lib/storeHooks";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: number;
}

export const DuelInfo = ({ duelId }: Props) => {
    const currentUser = useAppSelector(selectCurrentUser);

    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId);

    if (!duel || isDuelLoading) return <div>...</div>;

    let [user1, user2] = duel.participants;
    if (currentUser?.id === user2.id) {
        [user1, user2] = [user2, user1];
    }

    // TODO: не особо хочется это писать. Хочу чтобы бэк поправил сигнатуру на дельты
    let newRating1: number | undefined;
    let newRating2: number | undefined;
    let delta1: number | undefined;
    let delta2: number | undefined;

    if (duel.status === "Finished" && duel.winner_id !== undefined) {
        const result1: DuelResultType =
            duel.winner_id === user1.id ? "Win" : duel.winner_id === user2.id ? "Lose" : "Draw";

        const result2: DuelResultType =
            duel.winner_id === user2.id ? "Win" : duel.winner_id === user1.id ? "Lose" : "Draw";

        newRating1 = duel.rating_changes[user1.id]?.[result1];
        newRating2 = duel.rating_changes[user2.id]?.[result2];

        delta1 = newRating1 - user1.rating;
        delta2 = newRating2 - user2.rating;
    }
    // TODO: -------------------

    return (
        <div className={styles.duelInfo}>
            <UserCard user={user1} ratingDelta={delta1} />
            <div className={styles.duelContent}>
                {duel.status === "InProgress" ? (
                    <ActiveDuelTimer expiryTimestamp={new Date(`${duel.deadline_time}Z`)} />
                ) : (
                    <DuelResult
                        winnerId={duel?.winner_id ?? null}
                        meId={user1.id}
                        otherId={user2.id}
                    />
                )}
            </div>
            <UserCard user={user2} reversed ratingDelta={delta2} />
        </div>
    );
};
