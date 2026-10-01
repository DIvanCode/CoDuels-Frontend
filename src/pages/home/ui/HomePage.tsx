import { useEffect } from "react";

import { useGetDuelInvitationsQuery } from "entities/duel-invitation";
import { useLazyGetGroupInvitationsQuery } from "entities/group-invitation";
import { selectCurrentUser } from "entities/user";
import {
    DuelSessionButton,
    selectDuelSession,
    setDuelCanceled,
    setPhase,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
    useStartDuelSearchMutation,
} from "features/duel-session";
import {
    FriendlyDuelFlow,
    FriendlyDuelPendingButton,
    openFriendlyDuel,
    selectFriendlyDuel,
} from "widgets/friendly-duel";
import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { useSessionStorage } from "shared/lib/useSessionStorage";
import { Button, IconButton, MainCard, Modal, SearchLoader } from "shared/ui";

import styles from "./HomePage.module.scss";

interface IdleStateContentProps {
    nickname: string;
}

const IdleStateContent = ({ nickname }: IdleStateContentProps) => {
    return (
        <>
            <h2 className={styles.cardHeading}>
                Привет, <span className={styles.nickname}>{nickname}</span>!
            </h2>

            <p className={styles.cardDescription}>Время испытать свои навыки в дуэли!</p>
        </>
    );
};

interface SearchingStateContentProps {
    label: string;
}

const SearchingStateContent = ({ label }: SearchingStateContentProps) => {
    return (
        <>
            <h2 className={styles.cardHeading}>{label}</h2>

            <SearchLoader />
        </>
    );
};

const HomePage = () => {
    const user = useAppSelector(selectCurrentUser);
    const { phase, duelCanceled, duelCanceledOpponentNickname, searchInvitationType } =
        useAppSelector(selectDuelSession);
    const friendlyDuel = useAppSelector(selectFriendlyDuel);
    const dispatch = useAppDispatch();
    const [showStartPanel, setShowStartPanel] = useSessionStorage("home.showStartPanel", false);
    useGetDuelInvitationsQuery("Ranked", {
        skip: !user,
        refetchOnMountOrArgChange: true,
    });
    useGetDuelInvitationsQuery("Group", {
        skip: !user,
        refetchOnMountOrArgChange: true,
    });
    useGetDuelInvitationsQuery("Tournament", {
        skip: !user,
        refetchOnMountOrArgChange: true,
    });
    const [loadGroupInvitations] = useLazyGetGroupInvitationsQuery();
    const [startDuelSearch] = useStartDuelSearchMutation();
    useEffect(() => {
        if (!user?.id) return;
        void loadGroupInvitations();
    }, [user?.id, loadGroupInvitations]);

    const handleStartPanelToggle = () => {
        setShowStartPanel((prev) => !prev);
    };

    const handleStartPanelClose = () => {
        setShowStartPanel(false);
    };

    const handleQuickSearch = async () => {
        dispatch(setSearchNickname(null));
        dispatch(setSearchConfigurationId(null));
        dispatch(setSearchInvitationType(null));
        dispatch(setSearchTournamentId(null));

        try {
            await startDuelSearch().unwrap();
        } catch {
            return;
        }

        dispatch(setPhase("searching"));
        setShowStartPanel(false);
    };

    const handleFriendlyOpen = () => {
        setShowStartPanel(false);
        dispatch(openFriendlyDuel());
    };

    const handleDuelCanceledClose = () => {
        dispatch(setDuelCanceled(false));
    };

    const searchingLabel =
        searchInvitationType === "Tournament"
            ? "Ожидание начала турнирной дуэли"
            : "Ожидание соперника";

    return (
        <div className={styles.homePage}>
            <div className={styles.homeContent}>
                <MainCard className={styles.homeCard}>
                    {friendlyDuel.status === "pending" ? (
                        <SearchingStateContent label="Ожидание ответа соперника" />
                    ) : phase === "searching" ? (
                        <SearchingStateContent label={searchingLabel} />
                    ) : (
                        <IdleStateContent nickname={user?.nickname ?? "Аноним"} />
                    )}

                    {friendlyDuel.status === "pending" ? (
                        <div className={styles.duelAction}>
                            <FriendlyDuelPendingButton />
                        </div>
                    ) : phase === "searching" || phase === "active" ? (
                        <div className={styles.duelAction}>
                            <DuelSessionButton />
                        </div>
                    ) : (
                        <Button onClick={handleStartPanelToggle}>Начать</Button>
                    )}

                    {showStartPanel && (
                        <div className={styles.startOverlay}>
                            <div
                                className={`${styles.startPanel} ${styles.modePanel}`}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <IconButton
                                    className={styles.closeIconButton}
                                    onClick={handleStartPanelClose}
                                    aria-label="Закрыть"
                                    size="small"
                                >
                                    <CrossIcon />
                                </IconButton>
                                <div className={styles.startPanelHeading}>
                                    <h2>Режим дуэли</h2>
                                    <p>
                                        Запустите поиск оппонента для рейтинговой дуэли или вызовите
                                        на сражение определенного соперника.
                                    </p>
                                </div>
                                <div className={styles.startButtons}>
                                    <Button onClick={handleQuickSearch}>Рейтинговая дуэль</Button>
                                    <Button variant="outlined" onClick={handleFriendlyOpen}>
                                        Дружеская дуэль
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <FriendlyDuelFlow />
                </MainCard>
            </div>
            {duelCanceled && (
                <Modal title="Вызов не принят" onClose={handleDuelCanceledClose}>
                    <p className={styles.duelCanceledText}>
                        {duelCanceledOpponentNickname
                            ? `${duelCanceledOpponentNickname} не принял вызов на дуэль.`
                            : "Пользователь не принял вызов на дуэль."}
                    </p>
                    <Button className={styles.duelCanceledButton} onClick={handleDuelCanceledClose}>
                        Понятно
                    </Button>
                </Modal>
            )}
        </div>
    );
};

export default HomePage;
