import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useGetActiveDuelQuery } from "entities/duel";
import type { DuelConfiguration } from "entities/duel-configuration";
import { useGetDuelConfigurationsQuery } from "entities/duel-configuration";
import {
    useAcceptDuelInvitationMutation,
    useCreateDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useLazyGetDuelInvitationsQuery,
} from "entities/duel-invitation";
import { selectCurrentUser } from "entities/user";
import { DuelConfigurationManager, DuelConfigurationPicker } from "features/duel-configuration";
import {
    DuelSessionButton,
    selectDuelSession,
    useStartDuelSearchMutation,
} from "features/duel-session";
import {
    setDuelCanceled,
    setPhase,
    setSearchConfigurationId,
    setSearchNickname,
} from "features/duel-session/model/duelSessionSlice";
import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { useSessionStorage } from "shared/lib/useSessionStorage";
import {
    Button,
    IconButton,
    InputField,
    MainCard,
    Modal,
    SearchLoader,
    StatusCard,
} from "shared/ui";

import configStyles from "features/duel-configuration/ui/DuelConfigurationManager.module.scss";
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
        searchNickname,
        searchConfigurationId,
        duelCanceled,
        duelCanceledOpponentNickname,
    } = useAppSelector(selectDuelSession);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [showStartPanel, setShowStartPanel] = useSessionStorage("home.showStartPanel", false);
    const [showConfigPicker, setShowConfigPicker] = useSessionStorage(
        "home.showConfigPicker",
        false,
    );
    const [showConfigCreateModal, setShowConfigCreateModal] = useSessionStorage(
        "home.showConfigCreateModal",
        false,
    );
    const [editConfig, setEditConfig] = useState<DuelConfiguration | null>(null);
    const [showFriendlyForm, setShowFriendlyForm] = useSessionStorage(
        "home.showFriendlyForm",
        false,
    );
    const [friendlyNickname, setFriendlyNickname] = useSessionStorage("home.friendlyNickname", "");
    const [selectedConfigId, setSelectedConfigId] = useSessionStorage<number | null>(
        "home.selectedConfigId",
        null,
    );
    const [selectedDefaultConfig, setSelectedDefaultConfig] = useSessionStorage(
        "home.selectedDefaultConfig",
        true,
    );
    const [pendingInvitationNickname, setPendingInvitationNickname] = useSessionStorage<
        string | null
    >("home.pendingInvitationNickname", null);
    const [waitingForStart, setWaitingForStart] = useSessionStorage("home.waitingForStart", false);
    const [inviteError, setInviteError] = useState<{ title: string; description?: string } | null>(
        null,
    );
    const [inviteErrorClosing, setInviteErrorClosing] = useState(false);
    const { data: configs } = useGetDuelConfigurationsQuery();
    const [loadDuelInvitations, { data: duelInvitations }] = useLazyGetDuelInvitationsQuery();
    const [createDuelInvitation] = useCreateDuelInvitationMutation();
    const [acceptDuelInvitation] = useAcceptDuelInvitationMutation();
    const [denyDuelInvitation, { isLoading: isDenyingInvitation }] =
        useDenyDuelInvitationMutation();
    const [startDuelSearch] = useStartDuelSearchMutation();
    useGetActiveDuelQuery(undefined, { skip: !user });

    useEffect(() => {
        if (!user?.id) return;
        void loadDuelInvitations();
    }, [user?.id, loadDuelInvitations]);

    useEffect(() => {
        if (phase === "idle") return;

        setShowStartPanel(false);
        setShowConfigPicker(false);
        setShowConfigCreateModal(false);
        setShowFriendlyForm(false);
        setFriendlyNickname("");
        setSelectedConfigId(null);
        setSelectedDefaultConfig(true);
        setEditConfig(null);
    }, [phase]);

    useEffect(() => {
        if (!inviteError) {
            setInviteErrorClosing(false);
            return;
        }

        const closingTimeout = setTimeout(() => {
            setInviteErrorClosing(true);
        }, 2700);

        const clearTimeoutId = setTimeout(() => {
            setInviteError(null);
            setInviteErrorClosing(false);
        }, 3000);

        return () => {
            clearTimeout(closingTimeout);
            clearTimeout(clearTimeoutId);
        };
    }, [inviteError]);

    useEffect(() => {
        if (phase !== "searching") {
            setWaitingForStart(false);
        }
    }, [phase]);

    const prevPhaseRef = useRef(phase);

    useEffect(() => {
        if (!waitingForStart) {
            prevPhaseRef.current = phase;
            return;
        }

        if (prevPhaseRef.current === "searching" && phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }

        prevPhaseRef.current = phase;
    }, [phase, activeDuelId, waitingForStart, navigate]);

    const isSessionBusy = phase !== "idle";
    const visibleInvitations = (duelInvitations ?? []).filter(
        (invitation) => invitation.opponent_nickname,
    );

    const handleStartPanelToggle = () => {
        setShowStartPanel((prev) => !prev);
        if (showStartPanel) {
            setShowConfigPicker(false);
            setShowConfigCreateModal(false);
            setShowFriendlyForm(false);
            setFriendlyNickname("");
            setSelectedConfigId(null);
            setSelectedDefaultConfig(true);
            setEditConfig(null);
        }
    };

    const handleStartPanelClose = () => {
        setShowStartPanel(false);
        setSelectedConfigId(null);
    };

    const handleQuickSearch = async () => {
        dispatch(setSearchNickname(null));
        dispatch(setSearchConfigurationId(null));

        try {
            await startDuelSearch().unwrap();
        } catch {
            return;
        }

        dispatch(setPhase("searching"));
        setWaitingForStart(false);
        setShowStartPanel(false);
        setShowConfigPicker(false);
        setShowConfigCreateModal(false);
        setShowFriendlyForm(false);
        setSelectedDefaultConfig(true);
        setEditConfig(null);
    };

    const handleFriendlyOpen = () => {
        setShowStartPanel(false);
        setShowConfigPicker(true);
    };

    const handleConfigBack = () => {
        setShowConfigPicker(false);
        setSelectedConfigId(null);
        dispatch(setSearchConfigurationId(null));
        setSelectedDefaultConfig(true);
        setShowStartPanel(true);
    };

    const handleConfigClose = () => {
        setShowConfigPicker(false);
        setSelectedConfigId(null);
        dispatch(setSearchConfigurationId(null));
        setSelectedDefaultConfig(true);
    };

    const handleConfigNext = () => {
        if (selectedDefaultConfig) {
            dispatch(setSearchConfigurationId(null));
        } else if (selectedConfigId) {
            dispatch(setSearchConfigurationId(selectedConfigId));
        } else {
            return;
        }
        setShowConfigPicker(false);
        setShowFriendlyForm(true);
    };

    const handleConfigCreate = () => {
        setShowConfigCreateModal(true);
    };

    const handleConfigCreateClose = () => {
        setShowConfigCreateModal(false);
        setEditConfig(null);
    };

    const handleFriendlyCancel = () => {
        setShowFriendlyForm(false);
        setShowConfigPicker(true);
        setFriendlyNickname("");
        dispatch(setSearchNickname(null));
    };

    const handleFriendlyClose = () => {
        setShowFriendlyForm(false);
        setFriendlyNickname("");
        setSelectedConfigId(null);
        setSelectedDefaultConfig(true);
        dispatch(setSearchNickname(null));
        dispatch(setSearchConfigurationId(null));
        setEditConfig(null);
    };

    const handleFriendlySubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedNickname = friendlyNickname.trim();
        if (!trimmedNickname) return;
        if (user?.nickname && trimmedNickname.toLowerCase() === user.nickname.toLowerCase()) {
            setInviteError({
                title: "Нельзя вызвать себя на дуэль",
                description: "Укажите никнейм другого пользователя.",
            });
            setInviteErrorClosing(false);
            return;
        }

        const configurationId = selectedDefaultConfig ? null : selectedConfigId;

        try {
            setInviteError(null);
            await createDuelInvitation({
                opponent_nickname: trimmedNickname,
                configuration_id: configurationId ?? undefined,
            }).unwrap();
        } catch (error) {
            if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                (error as { status?: number }).status === 409
            ) {
                setInviteError({
                    title: "Не получилось отправить вызов на дуэль",
                    description: "Возможно, у вас уже есть вызов на дуэль от этого пользователя.",
                });
                setInviteErrorClosing(false);
                return;
            }
            return;
        }

        dispatch(setSearchNickname(trimmedNickname));
        dispatch(setSearchConfigurationId(configurationId ?? null));
        dispatch(setPhase("searching"));
        setWaitingForStart(false);
        setShowStartPanel(false);
        setShowConfigPicker(false);
        setShowConfigCreateModal(false);
        setShowFriendlyForm(false);
        setEditConfig(null);
    };

    const handleDuelCanceledClose = () => {
        dispatch(setDuelCanceled(false));
    };

    const handleInvitationAccept = async (nickname: string, configurationId?: number | null) => {
        if (isSessionBusy) return;

        try {
            await acceptDuelInvitation({
                opponent_nickname: nickname,
                configuration_id: configurationId ?? undefined,
            }).unwrap();
        } catch {
            return;
        }

        dispatch(setSearchNickname(nickname));
        dispatch(setSearchConfigurationId(configurationId ?? null));
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

    const searchingLabel = waitingForStart
        ? "Ждём начала..."
        : searchNickname
          ? `Ждём ${searchNickname}...`
          : searchConfigurationId
            ? "Ждём оппонента..."
            : "Поиск оппонента...";

    return (
        <div className={styles.homePage}>
            {inviteError && (
                <StatusCard
                    variant="error"
                    title={inviteError.title}
                    description={inviteError.description}
                    className={styles.statusBanner}
                    closing={inviteErrorClosing}
                    onClose={() => {
                        setInviteErrorClosing(true);
                        setTimeout(() => {
                            setInviteError(null);
                            setInviteErrorClosing(false);
                        }, 200);
                    }}
                />
            )}
            <div className={styles.homeContent}>
                <MainCard className={styles.homeCard}>
                    {phase === "searching" ? (
                        <SearchingStateContent label={searchingLabel} />
                    ) : (
                        <IdleStateContent nickname={user?.nickname ?? "Аноним"} />
                    )}

                    {phase === "searching" || phase === "active" ? (
                        <div
                            className={
                                waitingForStart && phase === "searching"
                                    ? `${styles.duelAction} ${styles.duelActionHidden}`
                                    : styles.duelAction
                            }
                        >
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

                    {showConfigPicker && (
                        <div className={styles.startOverlay}>
                            <div
                                className={styles.configPickerPanel}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <IconButton
                                    className={styles.closeIconButton}
                                    onClick={handleConfigClose}
                                    aria-label="Закрыть"
                                    size="small"
                                >
                                    <CrossIcon />
                                </IconButton>
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
                                    onCreate={handleConfigCreate}
                                    onEdit={(config) => {
                                        setEditConfig(config);
                                        setShowConfigCreateModal(true);
                                    }}
                                />
                                <div className={styles.configPickerActions}>
                                    <Button variant="outlined" onClick={handleConfigBack}>
                                        Назад
                                    </Button>
                                    <Button
                                        onClick={handleConfigNext}
                                        disabled={!selectedDefaultConfig && !selectedConfigId}
                                    >
                                        Далее
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showConfigCreateModal && (
                        <DuelConfigurationManager
                            mode="modalOnly"
                            forceFormOpen={showConfigCreateModal}
                            onForceFormClose={handleConfigCreateClose}
                            editConfig={editConfig}
                            onCreated={(config) => {
                                setSelectedConfigId(config.id);
                                setSelectedDefaultConfig(false);
                                setShowConfigPicker(true);
                                setEditConfig(null);
                            }}
                        />
                    )}

                    {showFriendlyForm && (
                        <div className={styles.startOverlay}>
                            <div
                                className={styles.startPanel}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <IconButton
                                    className={styles.closeIconButton}
                                    onClick={handleFriendlyClose}
                                    aria-label="Закрыть"
                                    size="small"
                                >
                                    <CrossIcon />
                                </IconButton>
                                <div className={styles.friendlyHeading}>
                                    <h2>Дружеская дуэль</h2>
                                </div>
                                <div className={styles.selectedConfig}>
                                    {selectedDefaultConfig || !selectedConfigId || !configs ? (
                                        <div className={configStyles.configItem}>
                                            <div
                                                className={`${configStyles.configSummary} ${styles.selectedConfigSummary}`}
                                            >
                                                <div className={configStyles.configTitle}>
                                                    Стандартные правила
                                                </div>
                                                <div className={configStyles.configMeta}>
                                                    Длительность: 30 минут
                                                </div>
                                                <div className={configStyles.configMeta}>
                                                    Показывать код соперника во время дуэли.
                                                </div>
                                                <div className={configStyles.configMeta}>
                                                    Одна задача.
                                                </div>
                                                <div className={configStyles.taskSummary}>
                                                    <div>Уровень определяется автоматически.</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        (() => {
                                            const selected = configs.find(
                                                (config) => config.id === selectedConfigId,
                                            );
                                            if (!selected) {
                                                return null;
                                            }
                                            const tasksEntries = Object.entries(
                                                selected.tasks ?? {},
                                            ).sort(
                                                ([leftKey], [rightKey]) =>
                                                    Number(leftKey) - Number(rightKey),
                                            );
                                            const taskSummary = tasksEntries.map(
                                                ([, task], index) => {
                                                    const taskKey = String.fromCharCode(65 + index);
                                                    const topics =
                                                        task.topics && task.topics.length > 0
                                                            ? ` | ${task.topics.join(", ")}`
                                                            : "";
                                                    return `${taskKey}: уровень ${task.level}${topics}`;
                                                },
                                            );
                                            const orderLabel =
                                                selected.task_order === "Sequential"
                                                    ? "Задачи открываются одна за другой."
                                                    : "Все задачи доступны сразу.";
                                            return (
                                                <div className={configStyles.configItem}>
                                                    <div
                                                        className={`${configStyles.configSummary} ${styles.selectedConfigSummary}`}
                                                    >
                                                        <div className={configStyles.configMeta}>
                                                            Длительность:{" "}
                                                            {selected.max_duration_minutes} мин
                                                        </div>
                                                        <div className={configStyles.configMeta}>
                                                            {selected.should_show_opponent_solution
                                                                ? "Показывать код соперника во время дуэли."
                                                                : "Не показывать код соперника во время дуэли."}
                                                        </div>
                                                        <div className={configStyles.configMeta}>
                                                            {orderLabel}
                                                        </div>
                                                        {taskSummary.length > 0 && (
                                                            <div
                                                                className={configStyles.taskSummary}
                                                            >
                                                                {taskSummary.map((item) => (
                                                                    <div key={item}>{item}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                                <p className={styles.friendlyDescription}>Укажите ник соперника.</p>
                                <form
                                    className={styles.friendlyForm}
                                    onSubmit={handleFriendlySubmit}
                                >
                                    <InputField
                                        id="friendly-duel-nickname"
                                        labelValue="Никнейм оппонента"
                                        wrapperClassName={styles.friendlyInputField}
                                        labelClassName={styles.friendlyInputLabelHidden}
                                        inputClassName={styles.friendlyInput}
                                        placeholder="Никнейм"
                                        value={friendlyNickname}
                                        onChange={(event) =>
                                            setFriendlyNickname(event.target.value)
                                        }
                                        autoComplete="off"
                                    />
                                    <div className={styles.friendlyButtons}>
                                        <Button variant="outlined" onClick={handleFriendlyCancel}>
                                            Назад
                                        </Button>
                                        <Button
                                            type="submit"
                                            className={styles.friendlySubmit}
                                            disabled={!friendlyNickname.trim()}
                                        >
                                            Вызов
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </MainCard>
                {visibleInvitations.length > 0 && phase !== "active" && (
                    <div className={styles.invitationsList}>
                        {visibleInvitations.map((invitation) => {
                            const nickname = invitation.opponent_nickname ?? "";
                            const isPending = pendingInvitationNickname === nickname;
                            const invitationKey = `${nickname}-${invitation.created_at}`;
                            const configurationId = invitation.configuration_id ?? null;
                            return (
                                <div className={styles.invitationItem} key={invitationKey}>
                                    <div className={styles.invitationInfo}>
                                        <span className={styles.invitationLabel}>
                                            {nickname
                                                ? `Вызов на дуэль от ${nickname}`
                                                : "Вызов на дуэль"}
                                        </span>
                                    </div>
                                    <div className={styles.invitationActions}>
                                        <Button
                                            className={styles.invitationAcceptButton}
                                            onClick={() =>
                                                handleInvitationAccept(nickname, configurationId)
                                            }
                                            disabled={isSessionBusy || !nickname}
                                        >
                                            Принять
                                        </Button>
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
