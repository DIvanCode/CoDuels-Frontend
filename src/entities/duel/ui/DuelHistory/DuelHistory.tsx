import { Table } from "shared/ui";
import CupIcon from "shared/assets/icons/cup.svg?react";
import { useNavigate } from "react-router-dom";
import { formatIsoDateTime } from "shared/lib/isoTimestamp";
import { Duel } from "../../model/types";
import { getDuelResultForUser } from "../../lib/duelResultHelpers";
import { formatDuelDuration } from "../../lib/formatDuelDuration";
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
                    <th>Продолжительность дуэли</th>
                    <th>Изменение рейтинга</th>
                    <th>Дата</th>
                </tr>
            </thead>

            <tbody>
                {duels.map((duel) => {
                    const participants = duel.participants ?? [];
                    if (participants.length === 0) {
                        return null;
                    }

                    const isParticipant = participants.some((p) => p.id === currentUserId);
                    const opponent = isParticipant
                        ? (participants.find((p) => p.id !== currentUserId) ?? participants[0])
                        : participants[0];
                    const duelResult = isParticipant
                        ? getDuelResultForUser(duel, currentUserId)
                        : null;
                    const delta =
                        duel.is_rated && duelResult
                            ? duel.rating_changes?.[currentUserId]?.[duelResult]
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

                            <td>{formatDuelDuration(duel.start_time, duel.end_time)}</td>

                            <td
                                className={
                                    duel.is_rated
                                        ? duelResult
                                            ? deltaClassName[duelResult]
                                            : styles.neutralDelta
                                        : undefined
                                }
                            >
                                {duel.is_rated
                                    ? delta !== null && delta !== undefined
                                        ? delta > 0
                                            ? `+${delta}`
                                            : delta
                                        : "-"
                                    : "—"}
                            </td>

                            <td>{formatIsoDateTime(duel.start_time)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
};
