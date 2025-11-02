import { DuelResult, useGetDuelQuery } from "entities/duel";
import { useGetUserQuery, UserCard } from "entities/user";
import { useAppSelector } from "shared/lib/storeHooks";

import { selectDuelSession } from "features/duel-session/model/selectors";
import { skipToken } from "@reduxjs/toolkit/query";
import { selectCurrentUser } from "features/auth";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: string;
}

export const DuelInfo = ({ duelId }: Props) => {
    const currentUser = useAppSelector(selectCurrentUser);

    const { activeDuelId } = useAppSelector(selectDuelSession);
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId);

    const { data: opponentUser, isLoading: isOpponentUserLoading } = useGetUserQuery(
        duel?.opponent_user_id ?? skipToken,
    );

    if (!currentUser || isDuelLoading || isOpponentUserLoading) return <div>...</div>;

    return (
        <div className={styles.duelInfo}>
            <UserCard user={opponentUser!} />
            <div className={styles.duelContent}>
                {duelId === activeDuelId ? (
                    <ActiveDuelTimer expiryTimestamp={new Date(duel!.deadline_at)} />
                ) : (
                    <DuelResult duel={duel!} fstUserId={opponentUser!.id} />
                )}
            </div>
            <UserCard user={currentUser} reversed />
        </div>
    );
};
