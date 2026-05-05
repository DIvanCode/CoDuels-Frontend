import { useParams } from "react-router-dom";
import Split from "react-split";

import { useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { useActionsAutoFlush } from "features/anti-cheat";
import { selectAuthToken } from "features/auth";
import { selectDuelSession } from "features/duel-session";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader, StatusCard } from "shared/ui";
import { CodePanel } from "widgets/code-panel";
import { TaskPanel } from "widgets/task-panel";
import styles from "./DuelPage.module.scss";

const DuelPage = () => {
    const { duelId } = useParams();
    const user = useAppSelector(selectCurrentUser);
    const token = useAppSelector(selectAuthToken);
    const { phase } = useAppSelector(selectDuelSession);
    const duelIdNumber = duelId ? Number(duelId) : NaN;
    const isValidDuelId = Number.isFinite(duelIdNumber);
    const { data: duel, error, isLoading } = useGetDuelQuery(duelIdNumber, {
        skip: !isValidDuelId,
    });
    const hasNoAccess = (error as { status?: unknown } | undefined)?.status === 403;
    const isParticipant = (duel?.participants ?? []).some(
        (participant) => participant.id === user?.id,
    );

    useActionsAutoFlush({
        enabled: Boolean(duelId && user?.id && isParticipant),
        token: token ?? null,
        shouldSend: phase === "active",
    });

    if (isLoading) {
        return <Loader className={styles.statusPage} />;
    }

    if (hasNoAccess) {
        return (
            <div className={styles.statusPage}>
                <StatusCard variant="warning" title="Нет доступа к этой дуэли" />
            </div>
        );
    }

    return (
        <Split direction="horizontal" sizes={[50, 50]} minSize={300} className={styles.duelPage}>
            <CodePanel />
            <TaskPanel />
        </Split>
    );
};

export default DuelPage;
