import { DuelResult, DuelResultType, getDuelResultForUser, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser, UserCard } from "entities/user";
import { useAppSelector } from "shared/lib/storeHooks";
import { ResultModal } from "shared/ui";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: number;
}

export const DuelInfo = ({ duelId }: Props) => {
    const navigate = useNavigate();

    const currentUser = useAppSelector(selectCurrentUser);

    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId);
    const [showResult, setShowResult] = useState(false);
    const dismissedRef = useRef(false);
    const duelStatus = duel?.status;

    useEffect(() => {
        const storageKey = `duel:${duelId}:resultDismissed`;
        const isDismissed = (() => {
            try {
                return window.localStorage.getItem(storageKey) === "true";
            } catch {
                return false;
            }
        })();

        dismissedRef.current = isDismissed;

        if (isDismissed) {
            setShowResult(false);
            return;
        }

        if (duelStatus === "Finished") {
            setShowResult(true);
        } else {
            setShowResult(false);
        }
    }, [duelStatus, duelId]);

    const handleCloseResult = () => {
        setShowResult(false);
        dismissedRef.current = true;
        const storageKey = `duel:${duelId}:resultDismissed`;
        try {
            window.localStorage.setItem(storageKey, "true");
        } catch {
            // ignore storage errors
        }
    };

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

    const duelResult = duel.status === "Finished" ? getDuelResultForUser(duel, user1.id) : null;

    const resultTitleMap: Record<DuelResultType, string> = {
        Win: "Вы победили!",
        Lose: "Вы проиграли",
        Draw: "Ничья",
    };

    const delta = delta1 ?? 0;
    const changeText = delta > 0 ? `+${delta}` : delta;
    const resultDescription =
        duelResult !== null
            ? `Изменение рейтинга: ${changeText} (${user1.rating} → ${user1.rating + delta})`
            : null;

    const handleOnUserClick = (userId: number) =>
        userId !== currentUser?.id && navigate(`/profile/${userId}`);

    return (
        <>
            <div className={styles.duelInfo}>
                <UserCard
                    user={user1}
                    ratingDelta={delta1}
                    onClick={() => handleOnUserClick(user1.id)}
                />
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
                <UserCard
                    user={user2}
                    reversed
                    ratingDelta={delta2}
                    onClick={() => handleOnUserClick(user2.id)}
                />
            </div>
            {showResult && duelResult !== null && (
                <ResultModal
                    title={resultTitleMap[duelResult]}
                    description={resultDescription}
                    onClose={handleCloseResult}
                />
            )}
        </>
    );
};
