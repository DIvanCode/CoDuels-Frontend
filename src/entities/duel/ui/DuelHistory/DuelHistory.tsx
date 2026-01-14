import { Table } from "shared/ui";
import CupIcon from "shared/assets/icons/cup.svg?react";
import { useNavigate } from "react-router-dom";
import { formatDurationBetween } from "shared/lib/timeHelpers";
import { Duel } from "../../model/types";
import { getDuelResultForUser } from "../../lib/duelResultHelpers";
import styles from "./DuelHistory.module.scss";

interface DuelHistoryProps {
    duels: Duel[];
    currentUserId: number;
}

export const DuelHistory = ({ duels, currentUserId }: DuelHistoryProps) => {
    const navigate = useNavigate();

    const deltaClassName = {
        Win: styles.positiveDelta,
        Lose: styles.negativeDelta,
        Draw: styles.neutralDelta,
    };

    return (
        <Table className={styles.duelHistoryTable}>
            <thead>
                <tr>
                    <th>Оппонент</th>
                    <th>Контроль по времени</th>
                    <th>Изменение рейтинга</th>
                    <th>Дата</th>
                </tr>
            </thead>

            <tbody>
                {duels.map((duel) => {
                    const isParticipant = duel.participants.some((p) => p.id === currentUserId);
                    const opponent = isParticipant
                        ? (duel.participants.find((p) => p.id !== currentUserId) ??
                          duel.participants[0])
                        : duel.participants[0];
                    const duelResult = isParticipant
                        ? getDuelResultForUser(duel, currentUserId)
                        : null;
                    const delta = duelResult
                        ? duel.rating_changes[currentUserId]?.[duelResult]
                        : null;

                    return (
                        <tr
                            key={duel.id}
                            onClick={isParticipant ? () => navigate(`/duel/${duel.id}`) : undefined}
                        >
                            <td className={styles.opponentCell}>
                                {opponent.nickname}
                                <span className={styles.ratingWithIcon}>
                                    {opponent.rating}
                                    <CupIcon />
                                </span>
                            </td>

                            <td>
                                {formatDurationBetween(
                                    new Date(duel.start_time),
                                    new Date(duel.deadline_time),
                                )}
                            </td>

                            <td
                                className={
                                    duelResult ? deltaClassName[duelResult] : styles.neutralDelta
                                }
                            >
                                {delta !== null && delta !== undefined
                                    ? delta > 0
                                        ? `+${delta}`
                                        : delta
                                    : "-"}
                            </td>

                            <td>{new Date(duel.start_time).toLocaleDateString("ru-RU")}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
};
