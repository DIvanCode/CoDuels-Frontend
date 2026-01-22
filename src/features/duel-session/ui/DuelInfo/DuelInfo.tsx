import { DuelResult, DuelResultType, getDuelResultForUser, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser, UserCard } from "entities/user";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, Modal } from "shared/ui";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "shared/lib/useLocalStorage";
import {
    selectDuelSession,
    setDuelStatusChanged,
    setNewTasksAvailable,
} from "features/duel-session";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: number;
}

export const DuelInfo = ({ duelId }: Props) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const currentUser = useAppSelector(selectCurrentUser);
    const { newTasksAvailable, duelStatusChanged } = useAppSelector(selectDuelSession);

    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId);

    const [isDismissed, setIsDismissed] = useLocalStorage(`duel:${duelId}:resultDismissed`, false);
    const showResultModal = duel?.status === "Finished" && (!isDismissed || duelStatusChanged);
    const showUpdateModal = duelStatusChanged && duel?.status !== "Finished";
    const showNewTasksModal = newTasksAvailable;
    const handleResultModalClose = () => {
        setIsDismissed(true);
        if (duelStatusChanged) {
            dispatch(setDuelStatusChanged(false));
        }
    };
    const handleUpdateModalClose = () => {
        dispatch(setDuelStatusChanged(false));
    };

    if (!duel || isDuelLoading) return <div>...</div>;

    const participants = duel.participants ?? [];
    if (participants.length < 2) {
        return <div>...</div>;
    }

    let [user1, user2] = participants;
    if (currentUser?.id === user2.id) {
        [user1, user2] = [user2, user1];
    }

    let [delta1, delta2]: [number | undefined, number | undefined] = [undefined, undefined];
    if (duel.status === "Finished" && duel.winner_id !== undefined && duel.rating_changes) {
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
            {showResultModal && duelResult !== null && (
                <Modal title={resultTitleMap[duelResult]} onClose={handleResultModalClose}>
                    {duelResult && (
                        <div className={styles.resultContent}>
                            <p className={styles.description}>
                                Изменение рейтинга: {changeText}
                                <span className={styles.ratingChange}>
                                    ({user1.rating} {"->"} {user1.rating + delta})
                                </span>
                            </p>
                            <Button onClick={handleResultModalClose}>Назад к дуэли</Button>
                        </div>
                    )}
                </Modal>
            )}
            {showUpdateModal && (
                <Modal title="Дуэль обновлена" onClose={handleUpdateModalClose}>
                    <div className={styles.resultContent}>
                        <p className={styles.description}>
                            Проверьте, возможно, некоторые задачи стали доступны.
                        </p>
                        <Button onClick={handleUpdateModalClose}>Понятно</Button>
                    </div>
                </Modal>
            )}
            {showNewTasksModal && (
                <Modal
                    title="Открылись новые задачи"
                    onClose={() => dispatch(setNewTasksAvailable(false))}
                >
                    <div className={styles.resultContent}>
                        <p className={styles.description}>
                            Появились новые задачи дуэли. Проверьте список задач.
                        </p>
                        <Button onClick={() => dispatch(setNewTasksAvailable(false))}>
                            Понятно
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
};
