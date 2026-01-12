import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { DuelConfiguration } from "entities/duel-configuration";
import { useGetDuelConfigurationsQuery } from "entities/duel-configuration";
import { useDenyDuelRequestMutation, useGetDuelRequestsQuery } from "entities/duel-request";
import { selectCurrentUser } from "entities/user";
import { DuelConfigurationManager, DuelConfigurationPicker } from "features/duel-configuration";
import { DuelSessionButton, selectDuelSession } from "features/duel-session";
import {
    setDuelCanceled,
    setPhase,
    setSearchConfigurationId,
    setSearchNickname,
} from "features/duel-session/model/duelSessionSlice";
import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, IconButton, InputField, MainCard, ResultModal, SearchLoader } from "shared/ui";

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
    const [showStartPanel, setShowStartPanel] = useState(false);
    const [showConfigPicker, setShowConfigPicker] = useState(false);
    const [showConfigCreateModal, setShowConfigCreateModal] = useState(false);
    const [editConfig, setEditConfig] = useState<DuelConfiguration | null>(null);
    const [showFriendlyForm, setShowFriendlyForm] = useState(false);
    const [friendlyNickname, setFriendlyNickname] = useState("");
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [selectedDefaultConfig, setSelectedDefaultConfig] = useState(true);
    const [pendingRequestNickname, setPendingRequestNickname] = useState<string | null>(null);
    const [waitingForStart, setWaitingForStart] = useState(false);
    const { data: configs } = useGetDuelConfigurationsQuery();
    const { data: duelRequests } = useGetDuelRequestsQuery(undefined, { pollingInterval: 3000 });
    const [denyDuelRequest, { isLoading: isDenyingRequest }] = useDenyDuelRequestMutation();

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
    const visibleRequests = (duelRequests ?? []).filter((request) => request.opponent_nickname);

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

    const handleQuickSearch = () => {
        dispatch(setSearchNickname(null));
        dispatch(setSearchConfigurationId(null));
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

    const handleFriendlySubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedNickname = friendlyNickname.trim();
        if (!trimmedNickname) return;

        dispatch(setSearchNickname(trimmedNickname));
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

    const handleRequestAccept = (nickname: string) => {
        if (isSessionBusy) return;

        dispatch(setSearchNickname(nickname));
        dispatch(setSearchConfigurationId(null));
        dispatch(setPhase("searching"));
        setWaitingForStart(true);
    };

    const handleRequestDeny = async (nickname: string) => {
        setPendingRequestNickname(nickname);
        try {
            await denyDuelRequest(nickname).unwrap();
        } finally {
            setPendingRequestNickname(null);
        }
    };

    const searchingLabel = waitingForStart
        ? "Ждём начала..."
        : searchNickname
          ? `Ждем ${searchNickname}...`
          : searchConfigurationId
            ? "Ждем оппонента..."
            : "Поиск оппонента...";

    return (
        <div className={styles.homePage}>
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
                                className={styles.startPanel}
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
                                                            {selected.should_show_opponent_code
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
                {visibleRequests.length > 0 && phase !== "active" && (
                    <div className={styles.requestsList}>
                        {visibleRequests.map((request) => {
                            const nickname = request.opponent_nickname ?? "";
                            const isPending = pendingRequestNickname === nickname;
                            const requestKey = `${nickname}-${request.created_at}`;
                            return (
                                <div className={styles.requestItem} key={requestKey}>
                                    <div className={styles.requestInfo}>
                                        <span className={styles.requestLabel}>
                                            {nickname
                                                ? `Вызов на дуэль от ${nickname}`
                                                : "Вызов на дуэль"}
                                        </span>
                                    </div>
                                    <div className={styles.requestActions}>
                                        <Button
                                            className={styles.acceptButton}
                                            onClick={() => handleRequestAccept(nickname)}
                                            disabled={isSessionBusy || !nickname}
                                        >
                                            Принять
                                        </Button>
                                        <Button
                                            className={styles.denyButton}
                                            onClick={() => handleRequestDeny(nickname)}
                                            disabled={
                                                isSessionBusy ||
                                                !nickname ||
                                                isPending ||
                                                isDenyingRequest
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
                <ResultModal title="Вызов не принят" onClose={handleDuelCanceledClose}>
                    <p className={styles.duelCanceledText}>
                        {duelCanceledOpponentNickname
                            ? `${duelCanceledOpponentNickname} не принял вызов на дуэль.`
                            : "Пользователь не принял вызов на дуэль."}
                    </p>
                    <Button className={styles.duelCanceledButton} onClick={handleDuelCanceledClose}>
                        Понятно
                    </Button>
                </ResultModal>
            )}
        </div>
    );
};

export default HomePage;
