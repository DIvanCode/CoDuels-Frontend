import { useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink, useMatch, useNavigate, useParams } from "react-router-dom";

import type { UserData } from "entities/user";
import { selectCurrentUser, useLazyGetUserByNicknameQuery } from "entities/user";
import type { DuelConfiguration } from "entities/duel-configuration";
import {
    type GroupRole,
    type GroupUser,
    roleLabels,
    useGetGroupQuery,
    useGetGroupUsersQuery,
    useChangeGroupUserRoleMutation,
    useExcludeGroupUserMutation,
    useLeaveGroupMutation,
    useInviteGroupUserMutation,
    useUpdateGroupMutation,
} from "entities/group";
import { useGetGroupDuelsQuery } from "entities/duel";
import {
    setPhase,
    setSearchConfigurationId,
    setSearchNickname,
} from "features/duel-session/model/duelSessionSlice";
import { AppRoutes } from "shared/config";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import EditIcon from "shared/assets/icons/edit.svg?react";
import { Button, IconButton, InputField, Modal, Select, Table } from "shared/ui";
import inputStyles from "shared/ui/InputField/InputField.module.scss";
import { useCancelGroupInvitationMutation } from "entities/group-invitation";
import {
    useAcceptGroupDuelInvitationMutation,
    useCreateGroupDuelInvitationMutation,
} from "entities/duel-invitation";
import { DuelConfigurationManager, DuelConfigurationPicker } from "features/duel-configuration";
import configStyles from "features/duel-configuration/ui/DuelConfigurationManager.module.scss";

import styles from "./GroupPage.module.scss";

const roleOptions = [
    { value: "Manager" as const, label: roleLabels.Manager },
    { value: "Member" as const, label: roleLabels.Member },
];

const isManagerRole = (role: GroupRole | null) => role === "Creator" || role === "Manager";

const extractInviter = (member: GroupUser) => {
    const inviter = member.invited_by ?? null;
    if (!inviter) return null;
    return { id: inviter.id, nickname: inviter.nickname };
};

const formatCreatedAt = (value?: string | null) => {
    if (!value) return "Неизвестно";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Неизвестно";

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCountdown = (deadline?: string | null, nowMs: number = Date.now()) => {
    if (!deadline) return "00:00";

    const deadlineMs = new Date(`${deadline}Z`).getTime();
    if (Number.isNaN(deadlineMs)) return "00:00";

    const remainingMs = Math.max(0, deadlineMs - nowMs);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const getResultLetterForUser = (winnerId: number | null | undefined, userId: number) => {
    if (winnerId === null || winnerId === undefined) return "D";
    return winnerId === userId ? "W" : "L";
};

const getResultLetterClass = (letter: "W" | "L" | "D") => {
    if (letter === "W") return styles.duelResultWin;
    if (letter === "L") return styles.duelResultLoss;
    return styles.duelResultDraw;
};

const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectCurrentUser);
    const resolvedGroupId = Number(groupId);
    const isMembers = Boolean(useMatch(AppRoutes.GROUP_MEMBERS));
    const isDuels = Boolean(useMatch(AppRoutes.GROUP_DUELS));
    const isTournaments = Boolean(useMatch(AppRoutes.GROUP_TOURNAMENTS));
    const activeSection: "members" | "duels" | "tournaments" = isMembers
        ? "members"
        : isDuels
          ? "duels"
          : isTournaments
            ? "tournaments"
            : "members";
    const groupIdParam = groupId ?? "";
    const membersPath = AppRoutes.GROUP_MEMBERS.replace(":groupId", groupIdParam);
    const duelsPath = AppRoutes.GROUP_DUELS.replace(":groupId", groupIdParam);
    const tournamentsPath = AppRoutes.GROUP_TOURNAMENTS.replace(":groupId", groupIdParam);

    const {
        data: group,
        isLoading: isGroupLoading,
        error: groupError,
    } = useGetGroupQuery(resolvedGroupId, { skip: !resolvedGroupId });
    const {
        data: members,
        isLoading: isMembersLoading,
        error: membersError,
    } = useGetGroupUsersQuery(resolvedGroupId, { skip: !resolvedGroupId });
    const {
        data: groupDuels,
        isLoading: isGroupDuelsLoading,
        isError: isGroupDuelsError,
    } = useGetGroupDuelsQuery(resolvedGroupId, {
        skip: !resolvedGroupId || activeSection !== "duels",
    });

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [selectedRole, setSelectedRole] = useState<GroupRole>("Member");
    const [pendingInvites, setPendingInvites] = useState<
        Array<{ user: UserData; role: GroupRole }>
    >([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [getUserByNickname, { isFetching: isSearchingUser }] = useLazyGetUserByNicknameQuery();
    const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
    const [changeGroupUserRole, { isLoading: isChangingRole }] = useChangeGroupUserRoleMutation();
    const [inviteGroupUser, { isLoading: isInviting }] = useInviteGroupUserMutation();
    const [cancelGroupInvitation, { isLoading: isCancelingInvitation }] =
        useCancelGroupInvitationMutation();
    const [createGroupDuelInvitation, { isLoading: isCreatingGroupDuel }] =
        useCreateGroupDuelInvitationMutation();
    const [acceptGroupDuelInvitation, { isLoading: isAcceptingGroupDuel }] =
        useAcceptGroupDuelInvitationMutation();
    const [excludeGroupUser, { isLoading: isExcluding }] = useExcludeGroupUserMutation();
    const [leaveGroup, { isLoading: isLeavingGroup }] = useLeaveGroupMutation();

    const currentUserRole = useMemo(() => {
        if (!members || !currentUser) return null;
        const entry = members.find((member) => member.user.id === currentUser.id);
        return entry?.role ?? null;
    }, [members, currentUser]);

    const canManage = isManagerRole(currentUserRole);

    const loadError =
        (groupError as { status?: number } | undefined) ??
        (membersError as { status?: number } | undefined);
    const isAccessError = loadError?.status === 403 || loadError?.status === 404;

    useEffect(() => {
        if (isAccessError) {
            setIsLoadErrorOpen(true);
        }
    }, [isAccessError]);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editingRole, setEditingRole] = useState<GroupRole>("Member");
    const [editingNickname, setEditingNickname] = useState<string | null>(null);
    const [roleEditError, setRoleEditError] = useState<string | null>(null);
    const [isLoadErrorOpen, setIsLoadErrorOpen] = useState(false);
    const [excludeTarget, setExcludeTarget] = useState<GroupUser | null>(null);
    const [excludeError, setExcludeError] = useState<string | null>(null);
    const [leaveTarget, setLeaveTarget] = useState<{ id: number; name: string } | null>(null);

    const [isCreateDuelOpen, setIsCreateDuelOpen] = useState(false);
    const [duelPlayerQueryA, setDuelPlayerQueryA] = useState("");
    const [duelPlayerQueryB, setDuelPlayerQueryB] = useState("");
    const [selectedPlayerA, setSelectedPlayerA] = useState<GroupUser | null>(null);
    const [selectedPlayerB, setSelectedPlayerB] = useState<GroupUser | null>(null);
    const [duelFormError, setDuelFormError] = useState<string | null>(null);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [selectedDefaultConfig, setSelectedDefaultConfig] = useState(true);
    const [showConfigCreateModal, setShowConfigCreateModal] = useState(false);
    const [editConfig, setEditConfig] = useState<DuelConfiguration | null>(null);
    const [nowMs, setNowMs] = useState(() => Date.now());

    const handleEditOpen = () => {
        setGroupName(group?.name ?? "");
        setFormError(null);
        setIsEditOpen(true);
    };

    const handleEditClose = () => {
        setIsEditOpen(false);
        setGroupName("");
        setFormError(null);
    };

    const handleAddOpen = () => {
        setIsAddOpen(true);
        setSearchValue("");
        setSelectedRole("Member");
        setPendingInvites([]);
        setSearchError(null);
    };

    const handleAddClose = () => {
        setIsAddOpen(false);
        setSearchValue("");
        setSelectedRole("Member");
        setPendingInvites([]);
        setSearchError(null);
    };

    const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = groupName.trim();
        if (!trimmed || !resolvedGroupId) {
            setFormError("Укажите название группы.");
            return;
        }

        try {
            await updateGroup({ id: resolvedGroupId, name: trimmed }).unwrap();
            handleEditClose();
        } catch {
            setFormError("Не удалось обновить группу.");
        }
    };

    const handleSearch = async () => {
        const rawValue = searchValue.trim();
        if (!rawValue) {
            setSearchError("Введите никнейм пользователя.");
            return;
        }

        if (
            currentUser?.nickname &&
            rawValue.toLowerCase() === currentUser.nickname.toLowerCase()
        ) {
            setSearchError("Нельзя добавить себя.");
            return;
        }

        try {
            const user = await getUserByNickname(rawValue).unwrap();
            const existingMember = members?.find((member) => member.user.id === user.id) ?? null;
            if (existingMember) {
                setSearchError(
                    existingMember.status === "Pending"
                        ? "Пользователь уже приглашен."
                        : "Пользователь уже в группе.",
                );
                return;
            }
            if (pendingInvites.some((invite) => invite.user.id === user.id)) {
                setSearchError("Пользователь уже выбран.");
                return;
            }
            setPendingInvites((prev) => [...prev, { user, role: selectedRole }]);
            setSearchError(null);
            setSearchValue("");
        } catch {
            setSearchError("Пользователь не найден.");
        }
    };

    const handleInvite = async () => {
        if (!resolvedGroupId || pendingInvites.length === 0) {
            setSearchError("Сначала найдите пользователя.");
            return;
        }

        try {
            await Promise.allSettled(
                pendingInvites.map((invite) =>
                    inviteGroupUser({
                        group_id: resolvedGroupId,
                        user_id: invite.user.id,
                        role: invite.role,
                    }).unwrap(),
                ),
            );
            setPendingInvites([]);
            setSearchValue("");
            setSearchError(null);
            setIsAddOpen(false);
        } catch {
            setSearchError("Не удалось отправить приглашение.");
        }
    };

    const handleRemovePending = (userId: number) => {
        setPendingInvites((prev) => prev.filter((invite) => invite.user.id !== userId));
    };

    const handleCancelInvitation = async (userId: number) => {
        if (!resolvedGroupId) return;
        try {
            await cancelGroupInvitation({ group_id: resolvedGroupId, user_id: userId }).unwrap();
        } catch {
            throw new Error("cancel-invitation-failed");
        }
    };

    const handleExcludeOpen = (member: GroupUser) => {
        setExcludeTarget(member);
        setExcludeError(null);
    };

    const handleExcludeClose = () => {
        setExcludeTarget(null);
        setExcludeError(null);
    };

    const handleExcludeConfirm = async () => {
        if (!resolvedGroupId || !excludeTarget) return;
        try {
            if (excludeTarget.status === "Pending") {
                await handleCancelInvitation(excludeTarget.user.id);
            } else {
                await excludeGroupUser({
                    id: resolvedGroupId,
                    user_id: excludeTarget.user.id,
                }).unwrap();
            }
            handleExcludeClose();
        } catch {
            setExcludeError("Не удалось исключить пользователя.");
        }
    };

    const handleStartRoleEdit = (member: GroupUser) => {
        setEditingUserId(member.user.id);
        setEditingRole(member.role);
        setEditingNickname(member.user.nickname ?? null);
        setRoleEditError(null);
    };

    const handleCancelRoleEdit = () => {
        setEditingUserId(null);
        setEditingRole("Member");
        setEditingNickname(null);
        setRoleEditError(null);
    };

    const handleSaveRoleEdit = async (userId: number) => {
        if (!resolvedGroupId) return;
        try {
            setRoleEditError(null);
            await changeGroupUserRole({
                id: resolvedGroupId,
                user_id: userId,
                role: editingRole,
            }).unwrap();
            handleCancelRoleEdit();
        } catch {
            setRoleEditError("Вы не можете изменить роль этого участника.");
        }
    };

    const handleLeaveGroup = async (groupId: number) => {
        try {
            await leaveGroup(groupId).unwrap();
            navigate(AppRoutes.GROUPS);
        } catch {
            return;
        }
    };

    const activeMembers = useMemo(() => {
        return (members ?? [])
            .filter((member) => member.status === "Active")
            .sort((left, right) => {
                const leftName = left.user.nickname ?? "";
                const rightName = right.user.nickname ?? "";
                return leftName.localeCompare(rightName);
            });
    }, [members]);

    const sortedGroupDuels = useMemo(() => {
        return [...(groupDuels ?? [])].sort((left, right) => {
            const leftTime = new Date(left.created_at).getTime();
            const rightTime = new Date(right.created_at).getTime();
            return rightTime - leftTime;
        });
    }, [groupDuels]);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    const buildSearchResults = (query: string, excludedIds: Array<number | null | undefined>) => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];
        const excludedSet = new Set<number>(excludedIds.filter(Boolean) as number[]);

        return activeMembers.filter((member) => {
            if (excludedSet.has(member.user.id)) return false;
            const nickname = member.user.nickname ?? "";
            return nickname.toLowerCase().includes(normalized);
        });
    };

    const duelSearchResultsA = buildSearchResults(duelPlayerQueryA, [
        selectedPlayerA?.user.id,
        selectedPlayerB?.user.id,
    ]);
    const duelSearchResultsB = buildSearchResults(duelPlayerQueryB, [
        selectedPlayerA?.user.id,
        selectedPlayerB?.user.id,
    ]);

    const resetDuelForm = () => {
        setDuelPlayerQueryA("");
        setDuelPlayerQueryB("");
        setSelectedPlayerA(null);
        setSelectedPlayerB(null);
        setDuelFormError(null);
        setSelectedConfigId(null);
        setSelectedDefaultConfig(true);
        setEditConfig(null);
        setShowConfigCreateModal(false);
    };

    const handleCreateDuelOpen = () => {
        resetDuelForm();
        setIsCreateDuelOpen(true);
    };

    const handleCreateDuelClose = () => {
        setIsCreateDuelOpen(false);
        resetDuelForm();
    };

    const handleCreateDuelSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!resolvedGroupId) {
            setDuelFormError("Не удалось определить группу.");
            return;
        }
        if (!selectedPlayerA || !selectedPlayerB) {
            setDuelFormError("Выберите двух участников.");
            return;
        }
        if (selectedPlayerA.user.id === selectedPlayerB.user.id) {
            setDuelFormError("Выберите разных участников.");
            return;
        }
        setDuelFormError(null);
        try {
            const configurationId =
                selectedDefaultConfig || !selectedConfigId ? null : selectedConfigId;
            await createGroupDuelInvitation({
                group_id: resolvedGroupId,
                user1_id: selectedPlayerA.user.id,
                user2_id: selectedPlayerB.user.id,
                configuration_id: configurationId,
            }).unwrap();
            setIsCreateDuelOpen(false);
            resetDuelForm();
        } catch {
            setDuelFormError("Не получилось создать дуэль. Попробуйте снова.");
        }
    };

    const handleAcceptPendingGroupDuel = async (
        opponentNickname: string | null | undefined,
        groupId: number,
        configurationId?: number | null,
    ) => {
        if (!opponentNickname) return;

        try {
            await acceptGroupDuelInvitation({
                group_id: groupId,
                opponent_nickname: opponentNickname,
                configuration_id: configurationId ?? undefined,
            }).unwrap();

            dispatch(setSearchNickname(opponentNickname));
            dispatch(setSearchConfigurationId(configurationId ?? null));
            dispatch(setPhase("searching"));
            sessionStorage.setItem("home.waitingForStart", JSON.stringify(true));
            navigate(AppRoutes.INDEX);
        } catch {
            return;
        }
    };

    const renderProfileLink = (nickname?: string | null) => {
        if (!nickname) {
            return <span className={styles.duelPlayerName}>Без никнейма</span>;
        }

        return (
            <button
                type="button"
                className={styles.userLink}
                onClick={() =>
                    navigate(AppRoutes.PROFILE.replace(":userNickname", String(nickname)))
                }
            >
                {nickname}
            </button>
        );
    };

    if (!resolvedGroupId) {
        return <div className={styles.status}>Группа не найдена.</div>;
    }

    if (isGroupLoading || isMembersLoading) {
        return <div className={styles.status}>Загрузка...</div>;
    }

    if (!group || !members || isAccessError) {
        return (
            <div className={styles.groupPage}>
                <div className={styles.status}>Не получилось отобразить группу.</div>
                {isLoadErrorOpen && (
                    <Modal
                        title="Не получилось отобразить группу"
                        onClose={() => setIsLoadErrorOpen(false)}
                    >
                        <p className={styles.excludeText}>
                            Возможно, у вас нет доступа или группа не найдена.
                        </p>
                        <div className={styles.formActions}>
                            <Button type="button" onClick={() => navigate(AppRoutes.INDEX)}>
                                Понятно
                            </Button>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div className={styles.groupPage}>
            <div className={styles.groupCard}>
                <div className={styles.header}>
                    <div className={styles.titleBlock}>
                        <Button
                            type="button"
                            variant="outlined"
                            className={styles.backButton}
                            onClick={() => navigate(AppRoutes.GROUPS)}
                        >
                            &lt; Назад к списку групп
                        </Button>
                        <div className={styles.titleRow}>
                            <h2 className={styles.title}>{group.name ?? "Без названия"}</h2>
                            {canManage && (
                                <IconButton
                                    className={styles.editIcon}
                                    onClick={handleEditOpen}
                                    aria-label="Изменить название группы"
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                            )}
                        </div>
                        <div className={styles.sectionTabs}>
                            <NavLink
                                to={membersPath}
                                className={({ isActive }) =>
                                    `${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`
                                }
                                end
                            >
                                Участники
                            </NavLink>
                            <NavLink
                                to={duelsPath}
                                className={({ isActive }) =>
                                    `${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`
                                }
                                end
                            >
                                Дуэли
                            </NavLink>
                            <NavLink
                                to={tournamentsPath}
                                className={({ isActive }) =>
                                    `${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`
                                }
                                end
                            >
                                Турниры
                            </NavLink>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            variant="outlined"
                            className={styles.leaveButton}
                            onClick={() =>
                                setLeaveTarget({
                                    id: group.id,
                                    name: group.name ?? "Без названия",
                                })
                            }
                        >
                            Покинуть группу
                        </Button>
                    </div>
                </div>

                {activeSection === "members" && (
                    <div className={styles.membersSection}>
                        {canManage && (
                            <Button className={styles.addButton} onClick={handleAddOpen}>
                                Добавить участников
                            </Button>
                        )}
                        <Table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Пользователь</th>
                                    <th>Роль</th>
                                    <th>Пригласил</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => {
                                    const inviter = extractInviter(member);
                                    const canEditRole =
                                        currentUserRole === "Creator"
                                            ? member.role !== "Creator"
                                            : currentUserRole === "Manager"
                                              ? member.role === "Member"
                                              : false;
                                    const isInviter = Boolean(
                                        inviter && inviter.id === currentUser?.id,
                                    );
                                    const canExclude =
                                        canEditRole &&
                                        member.user.id !== currentUser?.id &&
                                        (member.status !== "Pending" || isInviter);
                                    return (
                                        <tr key={member.user.id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.userLink}
                                                    onClick={() =>
                                                        navigate(
                                                            AppRoutes.PROFILE.replace(
                                                                ":userNickname",
                                                                String(member.user.nickname),
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {member.user.nickname}
                                                </button>
                                            </td>
                                            <td>
                                                <div className={styles.roleCell}>
                                                    <div className={styles.roleHeader}>
                                                        <span className={styles.roleLabel}>
                                                            {roleLabels[member.role]}
                                                        </span>
                                                        {member.status === "Pending" && (
                                                            <span className={styles.pendingLabel}>
                                                                (не подтвержден)
                                                            </span>
                                                        )}
                                                        {canEditRole &&
                                                            member.status !== "Pending" && (
                                                                <IconButton
                                                                    className={
                                                                        styles.roleEditButton
                                                                    }
                                                                    onClick={() =>
                                                                        handleStartRoleEdit(member)
                                                                    }
                                                                    aria-label="Изменить роль"
                                                                    size="small"
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            )}
                                                        {canExclude && (
                                                            <Button
                                                                variant="outlined"
                                                                className={styles.excludeButton}
                                                                onClick={() =>
                                                                    handleExcludeOpen(member)
                                                                }
                                                                disabled={
                                                                    isExcluding ||
                                                                    isCancelingInvitation
                                                                }
                                                            >
                                                                Исключить
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {inviter ? (
                                                    <button
                                                        type="button"
                                                        className={styles.inviterLink}
                                                        onClick={() =>
                                                            navigate(
                                                                AppRoutes.PROFILE.replace(
                                                                    ":userNickname",
                                                                    String(inviter.nickname),
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        {inviter.nickname}
                                                    </button>
                                                ) : (
                                                    ""
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}

                {activeSection === "duels" && (
                    <div className={styles.duelsSection}>
                        {canManage && (
                            <Button className={styles.addButton} onClick={handleCreateDuelOpen}>
                                Создать дуэль
                            </Button>
                        )}
                        {isGroupDuelsLoading && (
                            <div className={styles.duelsEmpty}>Загрузка дуэлей...</div>
                        )}
                        {isGroupDuelsError && (
                            <div className={styles.duelsEmpty}>Не удалось загрузить дуэли.</div>
                        )}
                        {!isGroupDuelsLoading &&
                            !isGroupDuelsError &&
                            (sortedGroupDuels.length > 0 ? (
                                <Table className={`${styles.table} ${styles.duelsTable}`}>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Результат</th>
                                            <th></th>
                                            <th>Дата</th>
                                            <th>Создатель</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedGroupDuels.map((duel) => {
                                            const user1Nickname = duel.user1?.nickname;
                                            const user2Nickname = duel.user2?.nickname;
                                            const creatorNickname = duel.created_by?.nickname;
                                            const duelData = duel.duel;
                                            const duelConfigurationId =
                                                duel.configuration_id ?? null;
                                            const isPending = duelData === null;
                                            const isInProgress = duelData?.status === "InProgress";
                                            const isFinished = duelData?.status === "Finished";
                                            const user1Result = duelData
                                                ? getResultLetterForUser(
                                                      duelData.winner_id,
                                                      duel.user1.id,
                                                  )
                                                : null;
                                            const user2Result = duelData
                                                ? getResultLetterForUser(
                                                      duelData.winner_id,
                                                      duel.user2.id,
                                                  )
                                                : null;
                                            const isCurrentUserUser1 =
                                                currentUser?.id != null &&
                                                duel.user1.id === currentUser.id;
                                            const isCurrentUserUser2 =
                                                currentUser?.id != null &&
                                                duel.user2.id === currentUser.id;
                                            const canAcceptAsUser1 =
                                                isPending &&
                                                isCurrentUserUser1 &&
                                                !duel.is_accepted_by_user1;
                                            const canAcceptAsUser2 =
                                                isPending &&
                                                isCurrentUserUser2 &&
                                                !duel.is_accepted_by_user2;
                                            const opponentForUser1 = duel.user2?.nickname;
                                            const opponentForUser2 = duel.user1?.nickname;

                                            return (
                                                <tr
                                                    key={`duel-${duelData?.id ?? "pending"}-${duel.created_at}-${duel.user1.id}-${duel.user2.id}`}
                                                >
                                                    <td>
                                                        <div className={styles.duelPlayerCell}>
                                                            {renderProfileLink(user1Nickname)}
                                                            {isPending &&
                                                                (canAcceptAsUser1 ? (
                                                                    <Button
                                                                        type="button"
                                                                        className={
                                                                            styles.pendingAcceptButton
                                                                        }
                                                                        onClick={() =>
                                                                            void handleAcceptPendingGroupDuel(
                                                                                opponentForUser1,
                                                                                resolvedGroupId,
                                                                                duelConfigurationId,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isAcceptingGroupDuel
                                                                        }
                                                                    >
                                                                        Принять
                                                                    </Button>
                                                                ) : (
                                                                    <span
                                                                        className={
                                                                            duel.is_accepted_by_user1
                                                                                ? styles.duelStatusOk
                                                                                : styles.duelStatusPending
                                                                        }
                                                                    >
                                                                        {duel.is_accepted_by_user1
                                                                            ? "Принял"
                                                                            : "Не принял"}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {isPending ? (
                                                            <span className={styles.duelMetaText}>
                                                                —
                                                            </span>
                                                        ) : isInProgress ? (
                                                            <div
                                                                className={
                                                                    styles.duelResultProgressCell
                                                                }
                                                            >
                                                                <span
                                                                    className={styles.duelMetaText}
                                                                >
                                                                    —
                                                                </span>
                                                                <span className={styles.duelTimer}>
                                                                    {formatCountdown(
                                                                        duelData?.deadline_time,
                                                                        nowMs,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ) : isFinished && duelData ? (
                                                            <div
                                                                className={
                                                                    styles.duelResultFinishedCell
                                                                }
                                                            >
                                                                <span
                                                                    className={`${styles.duelResultLetter} ${getResultLetterClass(user1Result ?? "D")}`}
                                                                >
                                                                    {user1Result}
                                                                </span>
                                                                <span
                                                                    className={styles.duelMetaText}
                                                                >
                                                                    —
                                                                </span>
                                                                <span
                                                                    className={`${styles.duelResultLetter} ${getResultLetterClass(user2Result ?? "D")}`}
                                                                >
                                                                    {user2Result}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className={styles.duelMetaText}>
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className={styles.duelPlayerCell}>
                                                            {renderProfileLink(user2Nickname)}
                                                            {isPending &&
                                                                (canAcceptAsUser2 ? (
                                                                    <Button
                                                                        type="button"
                                                                        className={
                                                                            styles.pendingAcceptButton
                                                                        }
                                                                        onClick={() =>
                                                                            void handleAcceptPendingGroupDuel(
                                                                                opponentForUser2,
                                                                                resolvedGroupId,
                                                                                duelConfigurationId,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isAcceptingGroupDuel
                                                                        }
                                                                    >
                                                                        Принять
                                                                    </Button>
                                                                ) : (
                                                                    <span
                                                                        className={
                                                                            duel.is_accepted_by_user2
                                                                                ? styles.duelStatusOk
                                                                                : styles.duelStatusPending
                                                                        }
                                                                    >
                                                                        {duel.is_accepted_by_user2
                                                                            ? "Принял"
                                                                            : "Не принял"}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </td>
                                                    <td>{formatCreatedAt(duel.created_at)}</td>
                                                    <td>{renderProfileLink(creatorNickname)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className={styles.duelsEmpty}>Пока нет дуэлей.</div>
                            ))}
                    </div>
                )}
            </div>

            {isEditOpen && (
                <Modal title="Редактировать" onClose={handleEditClose}>
                    <form className={styles.modalForm} onSubmit={handleUpdate}>
                        <InputField
                            id="group-edit-name"
                            labelValue=""
                            placeholder="Введите название"
                            value={groupName}
                            onChange={(event) => {
                                setGroupName(event.target.value);
                                setFormError(null);
                            }}
                            autoComplete="off"
                        />
                        {formError && <div className={styles.errorText}>{formError}</div>}
                        <div className={styles.formActions}>
                            <Button type="button" variant="outlined" onClick={handleEditClose}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                Сохранить
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {isAddOpen && (
                <Modal title="Добавить участников" onClose={handleAddClose}>
                    <div className={styles.modalForm}>
                        <div className={styles.searchRow}>
                            <InputField
                                id="group-add-user"
                                labelValue=""
                                labelClassName={styles.searchLabelHidden}
                                placeholder="Никнейм"
                                value={searchValue}
                                onChange={(event) => {
                                    setSearchValue(event.target.value);
                                    setSearchError(null);
                                }}
                                autoComplete="off"
                            />
                            <Select
                                value={selectedRole}
                                options={roleOptions}
                                onChange={setSelectedRole}
                                className={`${styles.roleSelect} ${styles.roleSelectMasked}`}
                                placeholder="Роль"
                            />
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={handleSearch}
                                disabled={isSearchingUser}
                            >
                                Найти
                            </Button>
                        </div>
                        {searchError && <div className={styles.errorText}>{searchError}</div>}
                        {pendingInvites.length > 0 && (
                            <div className={styles.inviteesList}>
                                {pendingInvites.map((invite) => (
                                    <div className={styles.foundUser} key={invite.user.id}>
                                        <div className={styles.foundUserInfo}>
                                            <span className={styles.foundUserName}>
                                                {invite.user.nickname}
                                            </span>
                                            <span className={styles.foundUserRole}>
                                                {roleLabels[invite.role]}
                                            </span>
                                        </div>
                                        <div className={styles.inviteeActions}>
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                onClick={() => handleRemovePending(invite.user.id)}
                                            >
                                                Убрать
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.formActions}>
                            <Button type="button" variant="outlined" onClick={handleAddClose}>
                                Отмена
                            </Button>
                            <Button
                                type="button"
                                onClick={handleInvite}
                                disabled={pendingInvites.length === 0 || isInviting}
                            >
                                Добавить
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {editingUserId && (
                <Modal title="Изменить роль" onClose={handleCancelRoleEdit}>
                    <div className={styles.modalForm}>
                        <div className={styles.roleEditRow}>
                            <span className={styles.roleEditName}>
                                {editingNickname ?? "Пользователь"}
                            </span>
                            <Select
                                value={editingRole}
                                options={roleOptions}
                                onChange={setEditingRole}
                                className={styles.roleSelectInline}
                            />
                        </div>
                        {roleEditError && <div className={styles.errorText}>{roleEditError}</div>}
                        <div className={styles.formActions}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={handleCancelRoleEdit}
                                disabled={isChangingRole}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleSaveRoleEdit(editingUserId)}
                                disabled={isChangingRole}
                            >
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {excludeTarget && (
                <Modal title="Исключить участника" onClose={handleExcludeClose}>
                    <p className={styles.excludeText}>
                        Исключить {excludeTarget.user.nickname} из группы?
                    </p>
                    {excludeError && <div className={styles.errorText}>{excludeError}</div>}
                    <div className={styles.formActions}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={handleExcludeClose}
                            disabled={isExcluding || isCancelingInvitation}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            className={styles.excludeConfirmButton}
                            onClick={handleExcludeConfirm}
                            disabled={isExcluding || isCancelingInvitation}
                        >
                            Исключить
                        </Button>
                    </div>
                </Modal>
            )}

            {leaveTarget && (
                <Modal
                    title="Покинуть группу"
                    onClose={() => setLeaveTarget(null)}
                    closeOnOverlay={false}
                >
                    <div className={styles.confirmText}>
                        Вы действительно хотите покинуть группу {leaveTarget.name}?
                    </div>
                    <div className={styles.formActions}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => setLeaveTarget(null)}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                await handleLeaveGroup(leaveTarget.id);
                                setLeaveTarget(null);
                            }}
                            disabled={isLeavingGroup}
                        >
                            Покинуть
                        </Button>
                    </div>
                </Modal>
            )}

            {isCreateDuelOpen && (
                <Modal title="Новая дуэль" onClose={handleCreateDuelClose}>
                    <form className={styles.duelForm} onSubmit={handleCreateDuelSubmit}>
                        <div className={styles.duelPlayers}>
                            <div className={styles.duelPlayerField}>
                                {!selectedPlayerA && (
                                    <InputField
                                        id="group-duel-player-a"
                                        labelValue="Игрок 1"
                                        placeholder="Никнейм"
                                        value={duelPlayerQueryA}
                                        onChange={(event) => {
                                            setDuelPlayerQueryA(event.target.value);
                                            setDuelFormError(null);
                                        }}
                                        autoComplete="off"
                                    />
                                )}
                                {selectedPlayerA && (
                                    <div
                                        className={`${inputStyles.inputField} ${styles.selectedPlayerField}`}
                                    >
                                        <div
                                            className={`${inputStyles.input} ${styles.selectedPlayerInput}`}
                                        >
                                            <span className={styles.selectedPlayerName}>
                                                {selectedPlayerA.user.nickname ?? "Без никнейма"}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                className={styles.removeButton}
                                                onClick={() => setSelectedPlayerA(null)}
                                            >
                                                Убрать
                                            </Button>
                                        </div>
                                        <label
                                            htmlFor="group-duel-player-a"
                                            className={inputStyles.inputLabel}
                                        >
                                            Игрок 1
                                        </label>
                                    </div>
                                )}
                                {!selectedPlayerA && duelPlayerQueryA.trim().length > 0 && (
                                    <div className={styles.searchResults}>
                                        {duelSearchResultsA.length > 0 ? (
                                            duelSearchResultsA.slice(0, 6).map((member) => (
                                                <button
                                                    key={member.user.id}
                                                    type="button"
                                                    className={styles.searchResult}
                                                    onClick={() => {
                                                        setSelectedPlayerA(member);
                                                        setDuelPlayerQueryA("");
                                                        setDuelFormError(null);
                                                    }}
                                                >
                                                    {member.user.nickname ?? "Без никнейма"}
                                                </button>
                                            ))
                                        ) : (
                                            <div className={styles.searchEmpty}>
                                                Ничего не найдено.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={styles.duelPlayerField}>
                                {!selectedPlayerB && (
                                    <InputField
                                        id="group-duel-player-b"
                                        labelValue="Игрок 2"
                                        placeholder="Никнейм"
                                        value={duelPlayerQueryB}
                                        onChange={(event) => {
                                            setDuelPlayerQueryB(event.target.value);
                                            setDuelFormError(null);
                                        }}
                                        autoComplete="off"
                                    />
                                )}
                                {selectedPlayerB && (
                                    <div
                                        className={`${inputStyles.inputField} ${styles.selectedPlayerField}`}
                                    >
                                        <div
                                            className={`${inputStyles.input} ${styles.selectedPlayerInput}`}
                                        >
                                            <span className={styles.selectedPlayerName}>
                                                {selectedPlayerB.user.nickname ?? "Без никнейма"}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                className={styles.removeButton}
                                                onClick={() => setSelectedPlayerB(null)}
                                            >
                                                Убрать
                                            </Button>
                                        </div>
                                        <label
                                            htmlFor="group-duel-player-b"
                                            className={inputStyles.inputLabel}
                                        >
                                            Игрок 2
                                        </label>
                                    </div>
                                )}
                                {!selectedPlayerB && duelPlayerQueryB.trim().length > 0 && (
                                    <div className={styles.searchResults}>
                                        {duelSearchResultsB.length > 0 ? (
                                            duelSearchResultsB.slice(0, 6).map((member) => (
                                                <button
                                                    key={member.user.id}
                                                    type="button"
                                                    className={styles.searchResult}
                                                    onClick={() => {
                                                        setSelectedPlayerB(member);
                                                        setDuelPlayerQueryB("");
                                                        setDuelFormError(null);
                                                    }}
                                                >
                                                    {member.user.nickname ?? "Без никнейма"}
                                                </button>
                                            ))
                                        ) : (
                                            <div className={styles.searchEmpty}>
                                                Ничего не найдено.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DuelConfigurationPicker
                            className={configStyles.cardFlat}
                            selectedId={selectedConfigId}
                            selectedIsDefault={selectedDefaultConfig}
                            onSelect={(id) => {
                                setSelectedConfigId(id);
                                setSelectedDefaultConfig(false);
                            }}
                            onSelectDefault={() => {
                                setSelectedConfigId(null);
                                setSelectedDefaultConfig(true);
                            }}
                            onClearSelection={() => {
                                setSelectedConfigId(null);
                                setSelectedDefaultConfig(true);
                            }}
                            onCreate={() => {
                                setEditConfig(null);
                                setShowConfigCreateModal(true);
                            }}
                            onEdit={(config) => {
                                setEditConfig(config);
                                setShowConfigCreateModal(true);
                            }}
                        />

                        {duelFormError && <div className={styles.errorText}>{duelFormError}</div>}

                        <div className={styles.formActions}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={handleCreateDuelClose}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isCreatingGroupDuel}>
                                Создать
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {showConfigCreateModal && (
                <DuelConfigurationManager
                    mode="modalOnly"
                    forceFormOpen={showConfigCreateModal}
                    onForceFormClose={() => {
                        setShowConfigCreateModal(false);
                        setEditConfig(null);
                    }}
                    editConfig={editConfig}
                    onCreated={(config) => {
                        setSelectedConfigId(config.id);
                        setSelectedDefaultConfig(false);
                        setShowConfigCreateModal(false);
                        setEditConfig(null);
                    }}
                />
            )}
        </div>
    );
};

export default GroupPage;
