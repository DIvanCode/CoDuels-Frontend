import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    duelInvitationApiSlice,
    useAcceptDuelInvitationMutation,
    useAcceptGroupDuelInvitationMutation,
    useAcceptTournamentDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useGetDuelInvitationsQuery,
} from "entities/duel-invitation";
import {
    groupInvitationApiSlice,
    useAcceptGroupInvitationMutation,
    useDenyGroupInvitationMutation,
    useGetGroupInvitationsQuery,
} from "entities/group-invitation";
import { roleLabels } from "entities/group";
import { selectCurrentUser, useGetMeQuery } from "entities/user";
import { selectAuthToken } from "features/auth";
import {
    selectDuelSession,
    setPhase,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
} from "features/duel-session";
import { AppRoutes } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { useSessionStorage } from "shared/lib/useSessionStorage";
import { Button } from "shared/ui";

import styles from "./InvitationNotifications.module.scss";

export const InvitationNotifications = () => {
    const user = useAppSelector(selectCurrentUser);
    const token = useAppSelector(selectAuthToken);
    const { isSuccess: isAuthenticated } = useGetMeQuery(undefined, { skip: !token });
    const { phase, activeDuelId, searchInvitationType } = useAppSelector(selectDuelSession);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const showForCurrentUser = Boolean(
        user?.id && token && isAuthenticated && location.pathname !== AppRoutes.AUTH,
    );
    const [pollingEnabled, setPollingEnabled] = useState(false);
    const [waitingForStart, setWaitingForStart] = useSessionStorage("home.waitingForStart", false);
    const [pendingInvitationNickname, setPendingInvitationNickname] = useSessionStorage<
        string | null
    >("home.pendingInvitationNickname", null);
    const [pendingGroupInvitationId, setPendingGroupInvitationId] = useSessionStorage<
        number | null
    >("home.pendingGroupInvitationId", null);

    useEffect(() => {
        if (!showForCurrentUser) {
            setPollingEnabled(false);
            return;
        }
        setPollingEnabled(false);
        const timer = window.setTimeout(() => setPollingEnabled(true), 10_000);
        return () => window.clearTimeout(timer);
    }, [user?.id, showForCurrentUser]);

    const shouldPoll = showForCurrentUser && pollingEnabled;
    const pollOptions = {
        skip: !shouldPoll,
        pollingInterval: 10_000,
        refetchOnMountOrArgChange: true,
    };
    useGetDuelInvitationsQuery("Ranked", pollOptions);
    useGetDuelInvitationsQuery("Group", pollOptions);
    useGetDuelInvitationsQuery("Tournament", pollOptions);
    useGetGroupInvitationsQuery(undefined, pollOptions);

    const { data: directDuelInvitations } =
        duelInvitationApiSlice.endpoints.getDuelInvitations.useQueryState("Ranked");
    const { data: groupDuelInvitations } =
        duelInvitationApiSlice.endpoints.getDuelInvitations.useQueryState("Group");
    const { data: tournamentDuelInvitations } =
        duelInvitationApiSlice.endpoints.getDuelInvitations.useQueryState("Tournament");
    const { data: groupInvitations } =
        groupInvitationApiSlice.endpoints.getGroupInvitations.useQueryState(undefined);

    const [acceptDuelInvitation] = useAcceptDuelInvitationMutation();
    const [acceptGroupDuelInvitation] = useAcceptGroupDuelInvitationMutation();
    const [acceptTournamentDuelInvitation] = useAcceptTournamentDuelInvitationMutation();
    const [denyDuelInvitation, { isLoading: isDenyingInvitation }] =
        useDenyDuelInvitationMutation();
    const [acceptGroupInvitation] = useAcceptGroupInvitationMutation();
    const [denyGroupInvitation, { isLoading: isDenyingGroupInvitation }] =
        useDenyGroupInvitationMutation();

    useEffect(() => {
        if (phase !== "searching" || searchInvitationType === null) {
            setWaitingForStart(false);
        }
    }, [phase, searchInvitationType, setWaitingForStart]);

    useEffect(() => {
        if (waitingForStart && phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }
    }, [waitingForStart, phase, activeDuelId, navigate]);

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
    const refreshDuelInvitations = (type: "Ranked" | "Group" | "Tournament") => {
        void dispatch(
            duelInvitationApiSlice.endpoints.getDuelInvitations.initiate(type, {
                subscribe: false,
                forceRefetch: true,
            }),
        );
    };
    const refreshGroupInvitations = () => {
        void dispatch(
            groupInvitationApiSlice.endpoints.getGroupInvitations.initiate(undefined, {
                subscribe: false,
                forceRefetch: true,
            }),
        );
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

        refreshDuelInvitations(invitationType ?? "Ranked");
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
            refreshDuelInvitations("Ranked");
        } finally {
            setPendingInvitationNickname(null);
        }
    };

    const handleGroupInvitationAccept = async (groupId: number) => {
        try {
            await acceptGroupInvitation({ group_id: groupId }).unwrap();
            refreshGroupInvitations();
        } catch {
            return;
        }
    };

    const handleGroupInvitationDeny = async (groupId: number) => {
        setPendingGroupInvitationId(groupId);
        try {
            await denyGroupInvitation({ group_id: groupId }).unwrap();
            refreshGroupInvitations();
        } finally {
            setPendingGroupInvitationId(null);
        }
    };

    if (!showForCurrentUser) return null;

    return (
        <>
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
                                            Роль: {roleLabels[invitation.role] ?? invitation.role}
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
                                                (isTournamentInvitation ? !tournamentId : !nickname)
                                            }
                                        >
                                            Принять
                                        </Button>
                                        {!isGroupInvitation && !isTournamentInvitation && (
                                            <Button
                                                className={styles.invitationDenyButton}
                                                onClick={() =>
                                                    handleInvitationDeny(nickname, configurationId)
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
        </>
    );
};
