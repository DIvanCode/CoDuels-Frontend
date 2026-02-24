import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { UserData } from "entities/user";
import { selectCurrentUser, useLazyGetUserByNicknameQuery } from "entities/user";
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
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import EditIcon from "shared/assets/icons/edit.svg?react";
import { Button, IconButton, InputField, Modal, Select, Table } from "shared/ui";
import { useCancelGroupInvitationMutation } from "entities/group-invitation";

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

const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);
    const resolvedGroupId = Number(groupId);

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
                    </div>
                    <div className={styles.headerActions}>
                        {canManage && (
                            <Button className={styles.addButton} onClick={handleAddOpen}>
                                Добавить участников
                            </Button>
                        )}
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
                            const isInviter = Boolean(inviter && inviter.id === currentUser?.id);
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
                                                        ":userId",
                                                        String(member.user.id),
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
                                                {canEditRole && member.status !== "Pending" && (
                                                    <IconButton
                                                        className={styles.roleEditButton}
                                                        onClick={() => handleStartRoleEdit(member)}
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
                                                        onClick={() => handleExcludeOpen(member)}
                                                        disabled={
                                                            isExcluding || isCancelingInvitation
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
                                                            ":userId",
                                                            String(inviter.id),
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
        </div>
    );
};

export default GroupPage;
