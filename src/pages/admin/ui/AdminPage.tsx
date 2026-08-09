import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Link } from "react-router-dom";

import {
    type Duel,
    type PendingDuel,
    useGetAdminActiveDuelsQuery,
    useGetAdminFinishedDuelsQuery,
    useGetAdminPendingDuelsQuery,
    useGetAdminRankedDuelSearchersQuery,
} from "entities/duel";
import { useGetAdminGroupsQuery } from "entities/group";
import {
    type AdminSubmissionItem,
    useGetAdminSubmissionsQuery,
    useGetAdminTestingSubmissionsQuery,
} from "entities/submission";
import {
    type Tournament,
    useGetAdminActiveTournamentsQuery,
    useGetAdminFinishedTournamentsQuery,
} from "entities/tournament";
import { type UserData, useGetAdminActiveUsersQuery, useGetAdminUsersQuery } from "entities/user";
import { isAdminAccessToken, selectAuthToken } from "features/auth";
import { AppRoutes, fromApiLanguage, LANGUAGE_LABELS } from "shared/config";
import { useAppSelector } from "shared/lib/storeHooks";
import { Loader, Table } from "shared/ui";
import {
    formatAdminDateTime,
    formatAdminWaitTime,
    getAdminSubmissionPath,
    getAdminSubmissionStatus,
    getCompletedSubmissions,
    getInactiveUsers,
    getPendingDuelsByType,
} from "../lib/adminPageHelpers";
import { AdminSection } from "./AdminSection";

import styles from "./AdminPage.module.scss";

const pendingDuelLabels = {
    Friendly: "Ожидающие дружеские дуэли",
    Group: "Ожидающие групповые дуэли",
    Tournament: "Ожидающие турнирные дуэли",
} as const;

const tournamentStatusLabels = {
    New: "Новый",
    InProgress: "Идёт",
    Finished: "Завершён",
} as const;

interface QueryContentProps {
    isLoading: boolean;
    isError: boolean;
    hasData: boolean;
    emptyText: string;
}

const QueryContent = ({
    isLoading,
    isError,
    hasData,
    emptyText,
    children,
}: PropsWithChildren<QueryContentProps>) => {
    if (isLoading && !hasData) {
        return <Loader className={styles.loader} />;
    }

    if (isError && !hasData) {
        return <div className={styles.message}>Не удалось загрузить данные.</div>;
    }

    if (!hasData) {
        return <div className={styles.message}>{emptyText}</div>;
    }

    return children;
};

const UserLink = ({ user }: { user: Pick<UserData, "nickname"> }) => (
    <Link
        className={styles.entityLink}
        to={AppRoutes.PROFILE.replace(":userNickname", user.nickname)}
    >
        {user.nickname}
    </Link>
);

const Acceptance = ({ accepted }: { accepted: boolean }) => (
    <span className={accepted ? styles.accepted : styles.waiting}>
        <span className={styles.statusDot} aria-hidden="true" />
        {accepted ? "Принял" : "Ожидается"}
    </span>
);

const UsersTable = ({ users, isActive }: { users: UserData[]; isActive: boolean }) => (
    <div className={styles.tableWrapper}>
        <Table className={styles.table}>
            <thead>
                <tr>
                    <th>Пользователь</th>
                    <th>Рейтинг</th>
                    <th>Регистрация</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>
                            <UserLink user={user} />
                        </td>
                        <td>{user.rating}</td>
                        <td>{formatAdminDateTime(user.created_at)}</td>
                        <td>
                            <span className={isActive ? styles.active : styles.inactive}>
                                <span className={styles.statusDot} aria-hidden="true" />
                                {isActive ? "Онлайн" : "Не в сети"}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </div>
);

const PendingDuelTable = ({ duels }: { duels: PendingDuel[] }) => (
    <div className={styles.tableWrapper}>
        <Table className={styles.table}>
            <thead>
                <tr>
                    <th>Участник 1</th>
                    <th>Статус</th>
                    <th>Участник 2</th>
                    <th>Статус</th>
                    <th>Контекст</th>
                    <th>Создана</th>
                </tr>
            </thead>
            <tbody>
                {duels.map((duel) => {
                    const groupPath = duel.group_id
                        ? AppRoutes.GROUP_MEMBERS.replace(":groupId", String(duel.group_id))
                        : null;
                    const tournamentPath =
                        duel.group_id && duel.tournament_id
                            ? AppRoutes.GROUP_TOURNAMENT.replace(
                                  ":groupId",
                                  String(duel.group_id),
                              ).replace(":tournamentId", String(duel.tournament_id))
                            : null;

                    return (
                        <tr key={`${duel.type}-${duel.id}`}>
                            <td>
                                <UserLink user={duel.user1} />
                            </td>
                            <td>
                                <Acceptance accepted={duel.is_accepted_by_user1} />
                            </td>
                            <td>
                                <UserLink user={duel.user2} />
                            </td>
                            <td>
                                <Acceptance accepted={duel.is_accepted_by_user2} />
                            </td>
                            <td>
                                <div className={styles.contextLinks}>
                                    {groupPath && (
                                        <Link className={styles.entityLink} to={groupPath}>
                                            {duel.group_name ?? `Группа #${duel.group_id}`}
                                        </Link>
                                    )}
                                    {tournamentPath && (
                                        <Link className={styles.entityLink} to={tournamentPath}>
                                            {duel.tournament_name ??
                                                `Турнир #${duel.tournament_id}`}
                                        </Link>
                                    )}
                                    {!groupPath && !tournamentPath && "Дружеская"}
                                </div>
                            </td>
                            <td>{formatAdminDateTime(duel.created_at)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    </div>
);

const DuelTable = ({ duels, finished }: { duels: Duel[]; finished: boolean }) => (
    <div className={styles.tableWrapper}>
        <Table className={styles.table}>
            <thead>
                <tr>
                    <th>Дуэль</th>
                    <th>Участники</th>
                    <th>Режим</th>
                    <th>{finished ? "Завершена" : "Начата"}</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                {duels.map((duel) => (
                    <tr key={duel.id}>
                        <td>
                            <Link
                                className={styles.entityLink}
                                to={AppRoutes.DUEL.replace(":duelId", String(duel.id))}
                            >
                                #{duel.id}
                            </Link>
                        </td>
                        <td>
                            <div className={styles.participants}>
                                {(duel.participants ?? []).map((participant, index) => (
                                    <span key={participant.id}>
                                        {index > 0 && <span className={styles.separator}>vs</span>}
                                        <UserLink user={participant} />
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td>{duel.is_rated ? "Рейтинговая" : "Нерейтинговая"}</td>
                        <td>
                            {formatAdminDateTime(
                                finished ? (duel.end_time ?? duel.start_time) : duel.start_time,
                            )}
                        </td>
                        <td>
                            <span className={finished ? styles.inactive : styles.active}>
                                <span className={styles.statusDot} aria-hidden="true" />
                                {finished ? "Завершена" : "Идёт"}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </div>
);

const SubmissionsTable = ({ submissions }: { submissions: AdminSubmissionItem[] }) => (
    <div className={styles.tableWrapper}>
        <Table className={styles.table}>
            <thead>
                <tr>
                    <th>Посылка</th>
                    <th>Пользователь</th>
                    <th>Отправлена</th>
                    <th>Язык</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                {submissions.map((submission) => {
                    const status = getAdminSubmissionStatus(submission);
                    const statusClassName =
                        status.tone === "accepted"
                            ? styles.submissionAccepted
                            : status.tone === "rejected"
                              ? styles.submissionRejected
                              : styles.submissionTesting;

                    return (
                        <tr key={submission.submission_id}>
                            <td>
                                <Link
                                    className={styles.entityLink}
                                    to={getAdminSubmissionPath(submission)}
                                    aria-label={`Открыть посылку #${submission.submission_id}`}
                                >
                                    #{submission.submission_id}
                                </Link>
                            </td>
                            <td>
                                {submission.author ? <UserLink user={submission.author} /> : "—"}
                            </td>
                            <td>{formatAdminDateTime(submission.created_at)}</td>
                            <td>{LANGUAGE_LABELS[fromApiLanguage(submission.language)]}</td>
                            <td>
                                <span className={statusClassName}>
                                    <span className={styles.statusDot} aria-hidden="true" />
                                    {status.label}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    </div>
);

const TournamentsTable = ({
    tournaments,
    groupsById,
}: {
    tournaments: Tournament[];
    groupsById: Map<number, string>;
}) => (
    <div className={styles.tableWrapper}>
        <Table className={styles.table}>
            <thead>
                <tr>
                    <th>Турнир</th>
                    <th>Группа</th>
                    <th>Статус</th>
                    <th>Создан</th>
                </tr>
            </thead>
            <tbody>
                {tournaments.map((tournament) => {
                    const groupPath = AppRoutes.GROUP_MEMBERS.replace(
                        ":groupId",
                        String(tournament.group_id),
                    );
                    const tournamentPath = AppRoutes.GROUP_TOURNAMENT.replace(
                        ":groupId",
                        String(tournament.group_id),
                    ).replace(":tournamentId", String(tournament.id));

                    return (
                        <tr key={tournament.id}>
                            <td>
                                <Link className={styles.entityLink} to={tournamentPath}>
                                    {tournament.name ?? `Турнир #${tournament.id}`}
                                </Link>
                            </td>
                            <td>
                                <Link className={styles.entityLink} to={groupPath}>
                                    {groupsById.get(tournament.group_id) ??
                                        `Группа #${tournament.group_id}`}
                                </Link>
                            </td>
                            <td>
                                <span
                                    className={
                                        tournament.status === "InProgress"
                                            ? styles.active
                                            : tournament.status === "New"
                                              ? styles.waiting
                                              : styles.inactive
                                    }
                                >
                                    <span className={styles.statusDot} aria-hidden="true" />
                                    {tournamentStatusLabels[tournament.status]}
                                </span>
                            </td>
                            <td>{formatAdminDateTime(tournament.created_at)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    </div>
);

const isForbiddenError = (error: unknown) =>
    typeof error === "object" && error !== null && "status" in error && error.status === 403;

const AccessDenied = () => (
    <div className={styles.adminPage}>
        <div className={styles.accessCard}>
            <span className={styles.eyebrow}>403</span>
            <h1>Нет доступа</h1>
            <p>Административная панель доступна только администраторам.</p>
            <Link className={styles.backLink} to={AppRoutes.INDEX}>
                Вернуться на главную
            </Link>
        </div>
    </div>
);

export const AdminPage = () => {
    const [now, setNow] = useState(() => Date.now());
    const token = useAppSelector(selectAuthToken);
    const isAdmin = isAdminAccessToken(token);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const skipAdminQueries = { skip: !isAdmin };
    const usersQuery = useGetAdminUsersQuery(undefined, skipAdminQueries);
    const activeUsersQuery = useGetAdminActiveUsersQuery(undefined, skipAdminQueries);
    const pendingDuelsQuery = useGetAdminPendingDuelsQuery(undefined, skipAdminQueries);
    const rankedSearchersQuery = useGetAdminRankedDuelSearchersQuery(undefined, skipAdminQueries);
    const activeDuelsQuery = useGetAdminActiveDuelsQuery(undefined, skipAdminQueries);
    const finishedDuelsQuery = useGetAdminFinishedDuelsQuery(undefined, skipAdminQueries);
    const testingSubmissionsQuery = useGetAdminTestingSubmissionsQuery(undefined, skipAdminQueries);
    const submissionsQuery = useGetAdminSubmissionsQuery(undefined, skipAdminQueries);
    const groupsQuery = useGetAdminGroupsQuery(undefined, skipAdminQueries);
    const activeTournamentsQuery = useGetAdminActiveTournamentsQuery(undefined, skipAdminQueries);
    const finishedTournamentsQuery = useGetAdminFinishedTournamentsQuery(
        undefined,
        skipAdminQueries,
    );

    const activeUsers = activeUsersQuery.data ?? [];
    const inactiveUsers = useMemo(
        () => getInactiveUsers(usersQuery.data ?? [], activeUsersQuery.data ?? []),
        [usersQuery.data, activeUsersQuery.data],
    );
    const pendingDuels = pendingDuelsQuery.data ?? [];
    const testingSubmissions = testingSubmissionsQuery.data ?? [];
    const completedSubmissions = useMemo(
        () => getCompletedSubmissions(submissionsQuery.data ?? []),
        [submissionsQuery.data],
    );
    const groups = groupsQuery.data ?? [];
    const groupsById = useMemo(
        () => new Map((groupsQuery.data ?? []).map((group) => [group.id, group.name])),
        [groupsQuery.data],
    );

    const queryErrors = [
        usersQuery.error,
        activeUsersQuery.error,
        pendingDuelsQuery.error,
        rankedSearchersQuery.error,
        activeDuelsQuery.error,
        finishedDuelsQuery.error,
        testingSubmissionsQuery.error,
        submissionsQuery.error,
        groupsQuery.error,
        activeTournamentsQuery.error,
        finishedTournamentsQuery.error,
    ];

    if (!isAdmin || queryErrors.some(isForbiddenError)) {
        return <AccessDenied />;
    }

    const friendlyDuels = getPendingDuelsByType(pendingDuels, "Friendly");
    const groupDuels = getPendingDuelsByType(pendingDuels, "Group");
    const tournamentDuels = getPendingDuelsByType(pendingDuels, "Tournament");
    const duelCount =
        (rankedSearchersQuery.data?.length ?? 0) +
        pendingDuels.length +
        (activeDuelsQuery.data?.length ?? 0) +
        (finishedDuelsQuery.data?.length ?? 0);
    const tournamentCount =
        (activeTournamentsQuery.data?.length ?? 0) + (finishedTournamentsQuery.data?.length ?? 0);

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageContent}>
                <header className={styles.pageHeader}>
                    <span className={styles.eyebrow}>CoDuels observe</span>
                    <h1>Административная панель</h1>
                    <p>Текущее состояние пользователей, дуэлей и соревнований.</p>
                </header>

                <AdminSection title="Пользователи" count={usersQuery.data?.length}>
                    <div className={styles.subsection}>
                        <h2>Активные пользователи</h2>
                        <QueryContent
                            isLoading={activeUsersQuery.isLoading}
                            isError={activeUsersQuery.isError}
                            hasData={activeUsers.length > 0}
                            emptyText="Сейчас нет активных пользователей."
                        >
                            <UsersTable users={activeUsers} isActive />
                        </QueryContent>
                    </div>
                    <div className={styles.subsection}>
                        <h2>Остальные пользователи</h2>
                        <QueryContent
                            isLoading={usersQuery.isLoading || activeUsersQuery.isLoading}
                            isError={usersQuery.isError || activeUsersQuery.isError}
                            hasData={inactiveUsers.length > 0}
                            emptyText="Других пользователей нет."
                        >
                            <UsersTable users={inactiveUsers} isActive={false} />
                        </QueryContent>
                    </div>
                </AdminSection>

                <AdminSection title="Дуэли" count={duelCount}>
                    <div className={styles.subsection}>
                        <h2>Поиск рейтинговой дуэли</h2>
                        <QueryContent
                            isLoading={rankedSearchersQuery.isLoading}
                            isError={rankedSearchersQuery.isError}
                            hasData={Boolean(rankedSearchersQuery.data?.length)}
                            emptyText="Никто не ищет рейтинговую дуэль."
                        >
                            <div className={styles.tableWrapper}>
                                <Table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Пользователь</th>
                                            <th>Рейтинг поиска</th>
                                            <th>Ожидает</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(rankedSearchersQuery.data ?? []).map((searcher) => (
                                            <tr key={searcher.user.id}>
                                                <td>
                                                    <UserLink user={searcher.user} />
                                                </td>
                                                <td>{searcher.rating}</td>
                                                <td>
                                                    {formatAdminWaitTime(
                                                        searcher.search_started_at,
                                                        now,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </QueryContent>
                    </div>

                    {(
                        [
                            ["Friendly", friendlyDuels],
                            ["Group", groupDuels],
                            ["Tournament", tournamentDuels],
                        ] as const
                    ).map(([type, duels]) => (
                        <div className={styles.subsection} key={type}>
                            <h2>{pendingDuelLabels[type]}</h2>
                            <QueryContent
                                isLoading={pendingDuelsQuery.isLoading}
                                isError={pendingDuelsQuery.isError}
                                hasData={duels.length > 0}
                                emptyText="Нет ожидающих дуэлей этого типа."
                            >
                                <PendingDuelTable duels={duels} />
                            </QueryContent>
                        </div>
                    ))}

                    <div className={styles.subsection}>
                        <h2>Дуэли в процессе</h2>
                        <QueryContent
                            isLoading={activeDuelsQuery.isLoading}
                            isError={activeDuelsQuery.isError}
                            hasData={Boolean(activeDuelsQuery.data?.length)}
                            emptyText="Сейчас нет активных дуэлей."
                        >
                            <DuelTable duels={activeDuelsQuery.data ?? []} finished={false} />
                        </QueryContent>
                    </div>

                    <div className={styles.subsection}>
                        <h2>Завершённые дуэли</h2>
                        <QueryContent
                            isLoading={finishedDuelsQuery.isLoading}
                            isError={finishedDuelsQuery.isError}
                            hasData={Boolean(finishedDuelsQuery.data?.length)}
                            emptyText="Завершённых дуэлей пока нет."
                        >
                            <DuelTable duels={finishedDuelsQuery.data ?? []} finished />
                        </QueryContent>
                    </div>
                </AdminSection>

                <AdminSection title="Посылки" count={submissionsQuery.data?.length}>
                    <div className={styles.subsection}>
                        <h2>Тестируются</h2>
                        <QueryContent
                            isLoading={testingSubmissionsQuery.isLoading}
                            isError={testingSubmissionsQuery.isError}
                            hasData={testingSubmissions.length > 0}
                            emptyText="Сейчас нет тестирующихся посылок."
                        >
                            <SubmissionsTable submissions={testingSubmissions} />
                        </QueryContent>
                    </div>
                    <div className={styles.subsection}>
                        <h2>Протестированы</h2>
                        <QueryContent
                            isLoading={submissionsQuery.isLoading}
                            isError={submissionsQuery.isError}
                            hasData={completedSubmissions.length > 0}
                            emptyText="Протестированных посылок пока нет."
                        >
                            <SubmissionsTable submissions={completedSubmissions} />
                        </QueryContent>
                    </div>
                </AdminSection>

                <AdminSection title="Группы" count={groupsQuery.data?.length}>
                    <QueryContent
                        isLoading={groupsQuery.isLoading}
                        isError={groupsQuery.isError}
                        hasData={groups.length > 0}
                        emptyText="Групп пока нет."
                    >
                        <div className={styles.tableWrapper}>
                            <Table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((group) => (
                                        <tr key={group.id}>
                                            <td>
                                                <Link
                                                    className={styles.entityLink}
                                                    to={AppRoutes.GROUP_MEMBERS.replace(
                                                        ":groupId",
                                                        String(group.id),
                                                    )}
                                                >
                                                    {group.name}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </QueryContent>
                </AdminSection>

                <AdminSection title="Турниры" count={tournamentCount}>
                    <div className={styles.subsection}>
                        <h2>Активные турниры</h2>
                        <QueryContent
                            isLoading={activeTournamentsQuery.isLoading}
                            isError={activeTournamentsQuery.isError}
                            hasData={Boolean(activeTournamentsQuery.data?.length)}
                            emptyText="Активных турниров нет."
                        >
                            <TournamentsTable
                                tournaments={activeTournamentsQuery.data ?? []}
                                groupsById={groupsById}
                            />
                        </QueryContent>
                    </div>
                    <div className={styles.subsection}>
                        <h2>Прошедшие турниры</h2>
                        <QueryContent
                            isLoading={finishedTournamentsQuery.isLoading}
                            isError={finishedTournamentsQuery.isError}
                            hasData={Boolean(finishedTournamentsQuery.data?.length)}
                            emptyText="Завершённых турниров пока нет."
                        >
                            <TournamentsTable
                                tournaments={finishedTournamentsQuery.data ?? []}
                                groupsById={groupsById}
                            />
                        </QueryContent>
                    </div>
                </AdminSection>
            </div>
        </div>
    );
};
