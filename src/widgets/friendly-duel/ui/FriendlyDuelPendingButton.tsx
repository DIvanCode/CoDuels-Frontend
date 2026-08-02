import { useCancelDuelInvitationMutation } from "entities/duel-invitation";
import {
    setPhase,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
} from "features/duel-session";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, StatusCard } from "shared/ui";

import {
    cancelFriendlyDuel,
    clearFriendlyDuelError,
    failFriendlyDuelCancellation,
    requestFriendlyDuelCancellation,
} from "../model/friendlyDuelSlice";
import { selectFriendlyDuel } from "../model/selectors";

import styles from "./FriendlyDuelFlow.module.scss";

export const FriendlyDuelPendingButton = () => {
    const dispatch = useAppDispatch();
    const friendlyDuel = useAppSelector(selectFriendlyDuel);
    const [cancelInvitation, { isLoading }] = useCancelDuelInvitationMutation();

    if (friendlyDuel.status !== "pending") return null;

    const handleCancel = async () => {
        if (friendlyDuel.isCanceling || isLoading) return;

        dispatch(requestFriendlyDuelCancellation());
        try {
            await cancelInvitation({
                opponent_nickname: friendlyDuel.nickname,
                configuration_id: friendlyDuel.usesDefaultConfiguration
                    ? undefined
                    : (friendlyDuel.configurationId ?? undefined),
            }).unwrap();
            dispatch(setSearchNickname(null));
            dispatch(setSearchConfigurationId(null));
            dispatch(setSearchInvitationType(null));
            dispatch(setSearchTournamentId(null));
            dispatch(setPhase("idle"));
            dispatch(cancelFriendlyDuel("user"));
        } catch {
            dispatch(
                failFriendlyDuelCancellation({
                    title: "Не удалось отменить вызов",
                    description: "Проверьте соединение и попробуйте ещё раз.",
                }),
            );
        }
    };

    return (
        <div className={styles.pendingControl}>
            {friendlyDuel.error && (
                <StatusCard
                    variant="error"
                    title={friendlyDuel.error.title}
                    description={friendlyDuel.error.description}
                    onClose={() => dispatch(clearFriendlyDuelError())}
                />
            )}
            <Button onClick={handleCancel} disabled={friendlyDuel.isCanceling || isLoading}>
                {friendlyDuel.isCanceling || isLoading ? "Отмена..." : "Отменить"}
            </Button>
        </div>
    );
};
