import { DuelResult, DuelResultType, getDuelResultForUser, useGetDuelQuery } from "entities/duel";
import { selectCurrentUser, UserCard } from "entities/user";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, Modal } from "shared/ui";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import {
    acknowledgeDuelResult,
    selectDuelSession,
    setDuelStatusChanged,
    setOpenedTaskKeys,
} from "features/duel-session";
import { notifyDuelResultAcknowledged } from "features/duel-session/model/duelResultAcknowledgement";
import { ActiveDuelTimer } from "../ActiveDuelTimer/ActiveDuelTimer";
import styles from "./DuelInfo.module.scss";

interface Props {
    duelId: number;
}

export const DuelInfo = ({ duelId }: Props) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const currentUser = useAppSelector(selectCurrentUser);
    const { activeDuelId, activeDuelUserId, duelStatusChanged, openedTaskKeys, pendingResult } =
        useAppSelector(selectDuelSession);

    const isCurrentActiveDuel = activeDuelId === duelId && activeDuelUserId === currentUser?.id;
    const { data: duel, isLoading: isDuelLoading } = useGetDuelQuery(duelId, {
        pollingInterval: isCurrentActiveDuel ? 2_000 : 0,
        skipPollingIfUnfocused: true,
        refetchOnReconnect: true,
    });

    const showResultModal =
        duel?.status === "Finished" &&
        pendingResult?.duelId === duelId &&
        pendingResult.userId === currentUser?.id;
    const showUpdateModal = duelStatusChanged && duel?.status !== "Finished";
    const handleResultModalClose = () => {
        if (currentUser) {
            notifyDuelResultAcknowledged(currentUser.id, duelId);
            dispatch(acknowledgeDuelResult({ userId: currentUser.id, duelId }));
        }
    };
    const handleUpdateModalClose = () => {
        dispatch(setDuelStatusChanged(false));
        dispatch(setOpenedTaskKeys([]));
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

    const getProfileClickHandler = (userId: number, nickname: string) =>
        userId === currentUser?.id
            ? undefined
            : () => navigate(AppRoutes.PROFILE.replace(":userNickname", nickname));

    return (
        <>
            <div className={styles.duelInfo}>
                <UserCard
                    user={user1}
                    ratingDelta={delta1}
                    onClick={getProfileClickHandler(user1.id, user1.nickname)}
                    ariaLabel={`Открыть профиль ${user1.nickname}`}
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
                    onClick={getProfileClickHandler(user2.id, user2.nickname)}
                    ariaLabel={`Открыть профиль ${user2.nickname}`}
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
                            {openedTaskKeys.length > 0
                                ? openedTaskKeys.length === 1
                                    ? `Открылась задача ${openedTaskKeys[0]}`
                                    : `Открылись задачи ${openedTaskKeys.join(", ")}`
                                : "Проверьте, возможно, некоторые задачи стали доступны"}
                        </p>
                        <Button onClick={handleUpdateModalClose}>Понятно</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};
