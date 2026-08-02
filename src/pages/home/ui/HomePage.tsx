import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
    useAcceptDuelInvitationMutation,
    useAcceptGroupDuelInvitationMutation,
    useAcceptTournamentDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useGetDuelInvitationsQuery,
} from "entities/duel-invitation";
import {
    useAcceptGroupInvitationMutation,
    useDenyGroupInvitationMutation,
    useLazyGetGroupInvitationsQuery,
} from "entities/group-invitation";
import { roleLabels } from "entities/group";
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
    const {
        phase,
        activeDuelId,
        duelCanceled,
        duelCanceledOpponentNickname,
        searchInvitationType,
    } = useAppSelector(selectDuelSession);
    const friendlyDuel = useAppSelector(selectFriendlyDuel);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [showStartPanel, setShowStartPanel] = useSessionStorage("home.showStartPanel", false);
    const [pendingInvitationNickname, setPendingInvitationNickname] = useSessionStorage<
        string | null
    >("home.pendingInvitationNickname", null);
    const [waitingForStart, setWaitingForStart] = useSessionStorage("home.waitingForStart", false);
    const { data: directDuelInvitations } = useGetDuelInvitationsQuery("Ranked", {
        skip: !user,
    });
    const { data: groupDuelInvitations } = useGetDuelInvitationsQuery("Group", {
        skip: !user,
    });
    const { data: tournamentDuelInvitations } = useGetDuelInvitationsQuery("Tournament", {
        skip: !user,
    });
    const [loadGroupInvitations, { data: groupInvitations }] = useLazyGetGroupInvitationsQuery();
    const [acceptDuelInvitation] = useAcceptDuelInvitationMutation();
    const [acceptGroupDuelInvitation] = useAcceptGroupDuelInvitationMutation();
    const [acceptTournamentDuelInvitation] = useAcceptTournamentDuelInvitationMutation();
    const [denyDuelInvitation, { isLoading: isDenyingInvitation }] =
        useDenyDuelInvitationMutation();
    const [acceptGroupInvitation] = useAcceptGroupInvitationMutation();
    const [denyGroupInvitation, { isLoading: isDenyingGroupInvitation }] =
        useDenyGroupInvitationMutation();
    const [startDuelSearch] = useStartDuelSearchMutation();
    useEffect(() => {
        if (!user?.id) return;
        // Duel invitations are loaded via useGetDuelInvitationsQuery per type.
        void loadGroupInvitations();
    }, [user?.id, loadGroupInvitations]);

    useEffect(() => {
        if (phase !== "searching") {
            setWaitingForStart(false);
        }
    }, [phase, setWaitingForStart]);

    const prevPhaseRef = useRef(phase);

    useEffect(() => {
        if (!waitingForStart) {
            prevPhaseRef.current = phase;
            return;
        }

        if (phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }

        prevPhaseRef.current = phase;
    }, [phase, activeDuelId, waitingForStart, navigate]);

    const isSessionBusy = phase !== "idle";
    const duelInvitations = [
        ...(directDuelInvitations ?? []),
        ...(groupDuelInvitations ?? []),
        ...(tournamentDuelInvitations ?? []),
    ];
    const visibleInvitations = duelInvitations.filter((invitation) => {
        const invitationType = invitation.type ?? "Ranked";
        const invitationGroup = invitation.group;
        if (invitationType === "Group" || invitationType === "Tournament" || invitationGroup) {
            return true;
        }
        return Boolean(invitation.opponent_nickname);
    });
    const visibleGroupInvitations = groupInvitations ?? [];
    const [pendingGroupInvitationId, setPendingGroupInvitationId] = useSessionStorage<
        number | null
    >("home.pendingGroupInvitationId", null);

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
        setWaitingForStart(false);
        setShowStartPanel(false);
    };

    const handleFriendlyOpen = () => {
        setShowStartPanel(false);
        dispatch(openFriendlyDuel());
    };

    const handleDuelCanceledClose = () => {
        dispatch(setDuelCanceled(false));
    };

    const handleInvitationAccept = async (
        nickname: string,
        configurationId?: number | null,
        invitationType?: "Ranked" | "Group" | "Tournament",
        groupId?: number,
        tournamentId?: number,
    ) => {
        if (isSessionBusy) return;
        if (invitationType === "Group" && !groupId) return;
        if (invitationType === "Tournament" && !tournamentId) return;

        try {
            if (invitationType === "Group") {
                await acceptGroupDuelInvitation({
                    group_id: groupId as number,
                    opponent_nickname: nickname,
                    configuration_id: configurationId ?? undefined,
                }).unwrap();
            } else if (invitationType === "Tournament") {
                await acceptTournamentDuelInvitation({
                    tournament_id: tournamentId as number,
                }).unwrap();
            } else {
                await acceptDuelInvitation({
                    opponent_nickname: nickname,
                    configuration_id: configurationId ?? undefined,
                }).unwrap();
            }
        } catch {
            return;
        }

        dispatch(setSearchNickname(nickname));
        dispatch(setSearchConfigurationId(configurationId ?? null));
        dispatch(setSearchInvitationType(invitationType ?? "Ranked"));
        dispatch(setSearchTournamentId(tournamentId ?? null));
        dispatch(setPhase("searching"));
        setWaitingForStart(true);
    };

    const handleInvitationDeny = async (nickname: string, configurationId?: number | null) => {
        setPendingInvitationNickname(nickname);
        try {
            await denyDuelInvitation({
                opponent_nickname: nickname,
                configuration_id: configurationId ?? undefined,
            }).unwrap();
        } finally {
            setPendingInvitationNickname(null);
        }
    };

    const handleGroupInvitationAccept = async (groupId: number) => {
        try {
            await acceptGroupInvitation({ group_id: groupId }).unwrap();
        } catch {
            return;
        }
    };

    const handleGroupInvitationDeny = async (groupId: number) => {
        setPendingGroupInvitationId(groupId);
        try {
            await denyGroupInvitation({ group_id: groupId }).unwrap();
        } finally {
            setPendingGroupInvitationId(null);
        }
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
                {(visibleInvitations.length > 0 || visibleGroupInvitations.length > 0) &&
                    phase !== "active" && (
                        <div className={styles.invitationsList}>
                            {visibleGroupInvitations.map((invitation) => {
                                const groupName = invitation.group_name ?? "Без названия";
                                const isPending = pendingGroupInvitationId === invitation.group_id;
                                return (
                                    <div
                                        className={styles.invitationItem}
                                        key={`group-${invitation.group_id}`}
                                    >
                                        <div className={styles.invitationInfo}>
                                            <span className={styles.invitationLabel}>
                                                Приглашение в группу
                                                <span className={styles.invitationGroupName}>
                                                    {groupName}
                                                </span>
                                            </span>
                                            <span className={styles.invitationMeta}>
                                                Роль:{" "}
                                                {roleLabels[invitation.role] ?? invitation.role}
                                            </span>
                                        </div>
                                        <div className={styles.invitationActions}>
                                            <Button
                                                className={styles.invitationAcceptButton}
                                                onClick={() =>
                                                    handleGroupInvitationAccept(invitation.group_id)
                                                }
                                                disabled={isPending || isDenyingGroupInvitation}
                                            >
                                                Принять
                                            </Button>
                                            <Button
                                                className={styles.invitationDenyButton}
                                                onClick={() =>
                                                    handleGroupInvitationDeny(invitation.group_id)
                                                }
                                                disabled={isPending || isDenyingGroupInvitation}
                                            >
                                                Отклонить
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {visibleInvitations.map((invitation) => {
                                const nickname = invitation.opponent_nickname ?? "";
                                const isPending = pendingInvitationNickname === nickname;
                                const invitationKey = `${invitation.tournament_id ?? "direct"}-${nickname}-${invitation.created_at}`;
                                const configurationId = invitation.configuration_id ?? null;
                                const invitationType = invitation.type ?? "Ranked";
                                const invitationGroup = invitation.group ?? null;
                                const isGroupInvitation =
                                    invitationType === "Group" || Boolean(invitationGroup);
                                const isTournamentInvitation = invitationType === "Tournament";
                                const groupId = invitationGroup?.id;
                                const groupName = invitationGroup?.name ?? "Без названия";
                                const tournamentId = invitation.tournament_id ?? null;
                                const tournamentName =
                                    invitation.tournament_name?.trim() || "Без названия";
                                return (
                                    <div className={styles.invitationItem} key={invitationKey}>
                                        <div className={styles.invitationInfo}>
                                            <span className={styles.invitationLabel}>
                                                {isTournamentInvitation
                                                    ? nickname
                                                        ? `Приглашение на дуэль с ${nickname} в турнире ${tournamentName}`
                                                        : `Приглашение на дуэль в турнире ${tournamentName}`
                                                    : isGroupInvitation
                                                      ? nickname
                                                          ? `Приглашение на дуэль с ${nickname} в группе ${groupName}`
                                                          : `Приглашение на дуэль в группе ${groupName}`
                                                      : nickname
                                                        ? `Вызов на дуэль от ${nickname}`
                                                        : "Вызов на дуэль"}
                                            </span>
                                        </div>
                                        <div className={styles.invitationActions}>
                                            <Button
                                                className={styles.invitationAcceptButton}
                                                onClick={() =>
                                                    handleInvitationAccept(
                                                        nickname,
                                                        configurationId,
                                                        isTournamentInvitation
                                                            ? "Tournament"
                                                            : isGroupInvitation
                                                              ? "Group"
                                                              : "Ranked",
                                                        groupId,
                                                        tournamentId ?? undefined,
                                                    )
                                                }
                                                disabled={
                                                    isSessionBusy ||
                                                    (isTournamentInvitation
                                                        ? !tournamentId
                                                        : !nickname)
                                                }
                                            >
                                                Принять
                                            </Button>
                                            {!isGroupInvitation && !isTournamentInvitation && (
                                                <Button
                                                    className={styles.invitationDenyButton}
                                                    onClick={() =>
                                                        handleInvitationDeny(
                                                            nickname,
                                                            configurationId,
                                                        )
                                                    }
                                                    disabled={
                                                        isSessionBusy ||
                                                        !nickname ||
                                                        isPending ||
                                                        isDenyingInvitation
                                                    }
                                                >
                                                    Отклонить
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
