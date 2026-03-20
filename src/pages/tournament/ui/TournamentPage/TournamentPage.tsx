import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetGroupQuery } from "entities/group";
import {
    TournamentBracket,
    useGetTournamentQuery,
    useStartTournamentMutation,
} from "entities/tournament";
import { AppRoutes } from "shared/config";
import { Button, MainCard } from "shared/ui";
import styles from "./TournamentPage.module.scss";

const isManagerRole = (role?: string | null) => role === "Creator" || role === "Manager";

const TournamentPage = () => {
    const navigate = useNavigate();
    const { groupId, tournamentId } = useParams();
    const resolvedGroupId = Number(groupId);
    const resolvedTournamentId = Number(tournamentId);
    const [actionError, setActionError] = useState<string | null>(null);

    const {
        data: group,
        isLoading: isGroupLoading,
        isError: isGroupError,
    } = useGetGroupQuery(resolvedGroupId, { skip: !resolvedGroupId });
    const {
        data,
        isLoading: isTournamentLoading,
        isError: isTournamentError,
    } = useGetTournamentQuery(resolvedTournamentId, { skip: !resolvedTournamentId });
    const [startTournament, { isLoading: isStartingTournament }] = useStartTournamentMutation();

    const backPath = AppRoutes.GROUP_TOURNAMENTS.replace(":groupId", groupId ?? "");
    const canStartTournament =
        data?.tournament.status === "New" && isManagerRole(group?.user_role ?? null);

    const handleStartTournament = async () => {
        if (!resolvedTournamentId || !resolvedGroupId) return;

        try {
            setActionError(null);
            await startTournament({
                id: resolvedTournamentId,
                groupId: resolvedGroupId,
            }).unwrap();
        } catch {
            setActionError("Не удалось начать турнир.");
        }
    };

    if (!resolvedGroupId || !resolvedTournamentId) {
        return <div className={styles.status}>Некорректный адрес турнира.</div>;
    }

    if (isGroupLoading || isTournamentLoading) {
        return <div className={styles.status}>Загрузка турнира...</div>;
    }

    if (isGroupError || isTournamentError || !data) {
        return <div className={styles.status}>Не удалось загрузить турнир.</div>;
    }

    return (
        <div className={styles.page}>
            <MainCard className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.headerMain}>
                        <Button
                            type="button"
                            variant="outlined"
                            className={styles.backButton}
                            onClick={() => navigate(backPath)}
                        >
                            &lt; Назад к турнирам
                        </Button>
                        <h1 className={styles.title}>{data.tournament.name ?? "Без названия"}</h1>
                        {canStartTournament && (
                            <Button
                                className={styles.startButton}
                                onClick={handleStartTournament}
                                disabled={isStartingTournament}
                            >
                                Начать турнир
                            </Button>
                        )}
                    </div>
                </div>

                {actionError && <div className={styles.error}>{actionError}</div>}

                {(data.tournament.status === "InProgress" ||
                    data.tournament.status === "Finished") && (
                    <div className={styles.bracketSection}>
                        <TournamentBracket data={data} />
                    </div>
                )}

                {data.tournament.status === "New" && !canStartTournament && (
                    <div className={styles.emptyState}>
                        Турнир еще не начат. Запустить его может создатель группы или менеджер.
                    </div>
                )}
            </MainCard>
        </div>
    );
};

export default TournamentPage;
