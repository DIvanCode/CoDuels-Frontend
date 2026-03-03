import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { UserData } from "entities/user";
import { selectCurrentUser, useLazyGetUserByNicknameQuery } from "entities/user";
import {
    type GroupRole,
    roleLabels,
    useCreateGroupMutation,
    useGetGroupsQuery,
    useLeaveGroupMutation,
    useInviteGroupUserMutation,
} from "entities/group";
import {
    useAcceptGroupInvitationMutation,
    useDenyGroupInvitationMutation,
    useLazyGetGroupInvitationsQuery,
} from "entities/group-invitation";
import { AppRoutes } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Button, InputField, Modal, Select, Table } from "shared/ui";

import styles from "./GroupsPage.module.scss";

interface Invitee {
    user: UserData;
    role: GroupRole;
}

const roleOptions = [
    { value: "Manager" as const, label: roleLabels.Manager },
    { value: "Member" as const, label: roleLabels.Member },
];

const GroupsPage = () => {
    const { data: groups, isLoading } = useGetGroupsQuery();
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [selectedRole, setSelectedRole] = useState<GroupRole>("Member");
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [getUserByNickname, { isFetching: isSearchingUser }] = useLazyGetUserByNicknameQuery();
    const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
    const [leaveGroup, { isLoading: isLeavingGroup }] = useLeaveGroupMutation();
    const [inviteGroupUser] = useInviteGroupUserMutation();
    const [loadGroupInvitations, { data: groupInvitations }] = useLazyGetGroupInvitationsQuery();
    const [acceptGroupInvitation] = useAcceptGroupInvitationMutation();
    const [denyGroupInvitation, { isLoading: isDenyingGroupInvitation }] =
        useDenyGroupInvitationMutation();
    const [pendingGroupInvitationId, setPendingGroupInvitationId] = useState<number | null>(null);
    const [pendingLeaveGroupId, setPendingLeaveGroupId] = useState<number | null>(null);
    const [leaveTarget, setLeaveTarget] = useState<{ id: number; name: string } | null>(null);

    const trimmedGroupName = groupName.trim();

    const isSubmitDisabled = useMemo(() => {
        return isCreating || !trimmedGroupName;
    }, [isCreating, trimmedGroupName]);

    useEffect(() => {
        void loadGroupInvitations();
    }, [loadGroupInvitations]);

    const handleCreateOpen = () => {
        setIsCreateOpen(true);
        setFormError(null);
    };

    const resetForm = () => {
        setGroupName("");
        setSearchValue("");
        setSelectedRole("Member");
        setInvitees([]);
        setFormError(null);
        setSearchError(null);
    };

    const handleCreateClose = () => {
        setIsCreateOpen(false);
        resetForm();
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
            const alreadyAdded = invitees.some((invitee) => invitee.user.id === user.id);
            if (alreadyAdded) {
                setSearchError("Пользователь уже добавлен.");
                return;
            }
            setInvitees((prev) => [...prev, { user, role: selectedRole }]);
            setSearchError(null);
            setSearchValue("");
        } catch {
            setSearchError("Пользователь не найден.");
        }
    };

    const handleRemoveInvitee = (userId: number) => {
        setInvitees((prev) => prev.filter((invitee) => invitee.user.id !== userId));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!trimmedGroupName) {
            setFormError("Укажите название группы.");
            return;
        }

        try {
            const createdGroup = await createGroup({ name: trimmedGroupName }).unwrap();
            if (invitees.length > 0) {
                await Promise.allSettled(
                    invitees.map((invitee) =>
                        inviteGroupUser({
                            group_id: createdGroup.id,
                            user_id: invitee.user.id,
                            role: invitee.role,
                        }).unwrap(),
                    ),
                );
            }
            setIsCreateOpen(false);
            resetForm();
        } catch {
            setFormError("Не удалось создать группу. Попробуйте ещё раз.");
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

    const handleLeaveGroup = async (groupId: number) => {
        setPendingLeaveGroupId(groupId);
        try {
            await leaveGroup(groupId).unwrap();
        } finally {
            setPendingLeaveGroupId(null);
        }
    };

    return (
        <div className={styles.groupsPage}>
            <div className={styles.groupsCard}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Группы</h2>
                    </div>
                    <Button className={styles.createButton} onClick={handleCreateOpen}>
                        Создать группу
                    </Button>
                </div>

                {groupInvitations && groupInvitations.length > 0 && (
                    <div className={styles.invitationsList}>
                        {groupInvitations.map((invitation) => {
                            const groupName = invitation.group_name ?? "Без названия";
                            const isPending =
                                pendingGroupInvitationId === invitation.group_id ||
                                isDenyingGroupInvitation;
                            return (
                                <div
                                    className={styles.invitationItem}
                                    key={`group-${invitation.group_id}`}
                                >
                                    <div className={styles.invitationInfo}>
                                        <span className={styles.invitationLabel}>
                                            Приглашение в группу {groupName}
                                        </span>
                                        <span className={styles.invitationMeta}>
                                            Роль: {invitation.role}
                                        </span>
                                    </div>
                                    <div className={styles.invitationActions}>
                                        <Button
                                            className={styles.invitationAcceptButton}
                                            onClick={() =>
                                                handleGroupInvitationAccept(invitation.group_id)
                                            }
                                            disabled={isPending}
                                        >
                                            Принять
                                        </Button>
                                        <Button
                                            className={styles.invitationDenyButton}
                                            onClick={() =>
                                                handleGroupInvitationDeny(invitation.group_id)
                                            }
                                            disabled={isPending}
                                        >
                                            Отклонить
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.status}>Загрузка...</div>
                ) : groups && groups.length > 0 ? (
                    <Table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Роль</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group.id}>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.groupLink}
                                            onClick={() =>
                                                navigate(
                                                    AppRoutes.GROUP_MEMBERS.replace(
                                                        ":groupId",
                                                        String(group.id),
                                                    ),
                                                )
                                            }
                                        >
                                            {group.name ?? "Без названия"}
                                        </button>
                                    </td>
                                    <td>{roleLabels[group.user_role]}</td>
                                    <td>
                                        <Button
                                            variant="outlined"
                                            className={styles.leaveButton}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setLeaveTarget({
                                                    id: group.id,
                                                    name: group.name ?? "Без названия",
                                                });
                                            }}
                                            disabled={
                                                isLeavingGroup ||
                                                pendingLeaveGroupId === group.id ||
                                                false
                                            }
                                        >
                                            Покинуть
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <div className={styles.emptyState}>Пока нет групп</div>
                )}
            </div>

            {isCreateOpen && (
                <Modal title="Создать группу" onClose={handleCreateClose}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <InputField
                            id="group-name"
                            labelValue="Название группы"
                            placeholder="Введите название"
                            value={groupName}
                            onChange={(event) => {
                                setGroupName(event.target.value);
                                setFormError(null);
                            }}
                            autoComplete="off"
                        />

                        <div className={styles.sectionTitle}>Участники</div>
                        <div className={styles.searchRow}>
                            <InputField
                                id="group-user-search"
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

                        {invitees.length > 0 && (
                            <div className={styles.inviteesList}>
                                {invitees.map((invitee) => (
                                    <div className={styles.foundUser} key={invitee.user.id}>
                                        <div className={styles.foundUserInfo}>
                                            <span className={styles.foundUserName}>
                                                {invitee.user.nickname}
                                            </span>
                                            <span className={styles.foundUserRole}>
                                                {roleLabels[invitee.role]}
                                            </span>
                                        </div>
                                        <div className={styles.inviteeActions}>
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                onClick={() => handleRemoveInvitee(invitee.user.id)}
                                            >
                                                Убрать
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formError && <div className={styles.errorText}>{formError}</div>}

                        <div className={styles.formActions}>
                            <Button type="button" variant="outlined" onClick={handleCreateClose}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isSubmitDisabled}>
                                Создать
                            </Button>
                        </div>
                    </form>
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
                            disabled={isLeavingGroup || pendingLeaveGroupId === leaveTarget.id}
                        >
                            Покинуть
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GroupsPage;
