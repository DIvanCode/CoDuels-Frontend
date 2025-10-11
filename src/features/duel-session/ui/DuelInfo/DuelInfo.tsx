import { DuelResult, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser, useGetUserQuery, UserCard } from "entities/user";
import { useAppSelector } from "shared/lib/storeHooks";

import { selectDuelSession } from "features/duel-session/model/selectors";
import { skipToken } from "@reduxjs/toolkit/query";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: string;
}

export const DuelInfo = ({ duelId }: Props) => {
    const user = useAppSelector(selectCurrentUser);

    const { activeDuelId } = useAppSelector(selectDuelSession);
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId);

    const { data: otherUser, isLoading: isOtherUserLoading } = useGetUserQuery(
        duel?.opponent_user_id ?? skipToken,
    );

    if (!user || isDuelLoading || isOtherUserLoading) return <div>...</div>;

    return (
        <div className={styles.duelInfo}>
            <UserCard user={otherUser!} />
            <div className={styles.duelContent}>
                {duelId === activeDuelId ? (
                    <ActiveDuelTimer expiryTimestamp={new Date(duel!.deadline_at)} />
                ) : (
                    <DuelResult duel={duel!} fstUserId={user.id} />
                )}
            </div>
            <UserCard user={user} reversed />
        </div>
    );
};
