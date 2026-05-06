import { useNavigate } from "react-router-dom";

import { AppRoutes } from "shared/config";
import { Table } from "shared/ui";
import type { GroupStageDuel, TournamentDetailsResponse } from "../../model/types";
import styles from "./GroupStageView.module.scss";

const formatDateTime = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getResultLetterForUser = (winnerId: number | null | undefined, userId: number) => {
    if (winnerId == null) return "D";

    return winnerId === userId ? "W" : "L";
};

const getResultLetterClass = (letter: "W" | "L" | "D") => {
    if (letter === "W") return styles.duelResultWin;
    if (letter === "L") return styles.duelResultLoss;

    return styles.duelResultDraw;
};

const DuelTable = ({ title, duels }: { title: string; duels: GroupStageDuel[] }) => {
    const navigate = useNavigate();

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {duels.length === 0 ? (
                <div className={styles.emptyState}>Нет дуэлей.</div>
            ) : (
                <Table className={styles.duelsTable}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Результат</th>
                            <th></th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        {duels.map((duel) => {
                            const user1Result = getResultLetterForUser(duel.winner_id, duel.user1.id);
                            const user2Result = getResultLetterForUser(duel.winner_id, duel.user2.id);
                            const duelPath = AppRoutes.DUEL.replace(":duelId", String(duel.id));

                            return (
                                <tr
                                    key={duel.id}
                                    className={styles.duelRow}
                                    onClick={() => navigate(duelPath)}
                                >
                                    <td>
                                        <div className={styles.duelPlayerCell}>
                                            {duel.user1.nickname}
                                        </div>
                                    </td>
                                    <td>
                                        {duel.status === "Finished" ? (
                                            <div className={styles.duelResultFinishedCell}>
                                                <span
                                                    className={`${styles.duelResultLetter} ${getResultLetterClass(user1Result)}`}
                                                >
                                                    {user1Result}
                                                </span>
                                                <span className={styles.duelMetaText}>-</span>
                                                <span
                                                    className={`${styles.duelResultLetter} ${getResultLetterClass(user2Result)}`}
                                                >
                                                    {user2Result}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={styles.duelMetaText}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.duelPlayerCell}>
                                            {duel.user2.nickname}
                                        </div>
                                    </td>
                                    <td>{formatDateTime(duel.start_time)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </section>
    );
};

export const GroupStageView = ({ data }: { data: TournamentDetailsResponse }) => {
    const groupStage = data.group_stage;

    if (!groupStage) {
        return <div className={styles.emptyState}>Нет данных группового этапа.</div>;
    }

    return (
        <div className={styles.groupStage}>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Турнирная таблица</h2>
                <Table className={styles.standingsTable}>
                    <thead>
                        <tr>
                            <th>Никнейм</th>
                            <th>Победы</th>
                            <th>Ничьи</th>
                            <th>Поражения</th>
                            <th>Очки</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupStage.standings.map((standing) => (
                            <tr key={standing.user.id}>
                                <td>{standing.user.nickname}</td>
                                <td>{standing.wins}</td>
                                <td>{standing.draws}</td>
                                <td>{standing.losses}</td>
                                <td>{standing.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </section>

            <DuelTable title="Текущие дуэли" duels={groupStage.current_duels} />
            <DuelTable title="Прошедшие дуэли" duels={groupStage.past_duels} />
        </div>
    );
};
