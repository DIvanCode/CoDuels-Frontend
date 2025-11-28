import { DuelResult, getDuelResultForUser, useGetDuelQuery } from "entities/duel";
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

    let [delta1, delta2]: [number | undefined, number | undefined] = [undefined, undefined];
    if (duel.status === "Finished" && duel.winner_id !== undefined) {
        delta1 = duel.rating_changes[user1.id][getDuelResultForUser(duel, user1.id)];
        delta2 = duel.rating_changes[user2.id][getDuelResultForUser(duel, user2.id)];
    }

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
