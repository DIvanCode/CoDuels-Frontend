import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { DuelConfiguration } from "entities/duel-configuration";
import { useGetDuelConfigurationsQuery } from "entities/duel-configuration";
import { useCreateDuelInvitationMutation } from "entities/duel-invitation";
import { DuelConfigurationManager, DuelConfigurationPicker } from "features/duel-configuration";
import {
    selectDuelSession,
    setPhase,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
} from "features/duel-session";
import CrossIcon from "shared/assets/icons/cross.svg?react";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button, IconButton, InputField, Modal } from "shared/ui";

import configStyles from "features/duel-configuration/ui/DuelConfigurationManager.module.scss";
import {
    beginFriendlyDuelPending,
    cancelFriendlyDuel,
    closeFriendlyDuel,
    failFriendlyDuelCreation,
    matchFriendlyDuel,
    restoreFriendlyDuelPending,
    returnToFriendlyDuelConfiguration,
    selectFriendlyDuelConfiguration,
    selectFriendlyDuelDefaultConfiguration,
    setFriendlyDuelUserId,
    setFriendlyDuelNickname,
    showFriendlyDuelConfigurationStep,
    showFriendlyDuelOpponentStep,
} from "../model/friendlyDuelSlice";
import { isFriendlyDuelConfigurationScenarioActive } from "../model/configurationScenario";
import { getFriendlyDuelCreationError } from "../model/creationError";
import { selectFriendlyDuel } from "../model/selectors";

import styles from "./FriendlyDuelFlow.module.scss";

const SelectedConfiguration = ({
    configurationId,
    usesDefaultConfiguration,
}: {
    configurationId: number | null;
    usesDefaultConfiguration: boolean;
}) => {
    const { data: configurations } = useGetDuelConfigurationsQuery();
    const selectedConfiguration = configurations?.find((config) => config.id === configurationId);

    if (usesDefaultConfiguration || !selectedConfiguration) {
        return (
            <div className={configStyles.configItem}>
                <div className={`${configStyles.configSummary} ${styles.selectedConfigSummary}`}>
                    <div className={configStyles.configTitle}>Стандартные правила</div>
                    <div className={configStyles.configMeta}>Длительность: 30 минут</div>
                    <div className={configStyles.configMeta}>
                        Показывать код соперника во время дуэли.
                    </div>
                    <div className={configStyles.configMeta}>Одна задача.</div>
                    <div className={configStyles.taskSummary}>
                        <div>Уровень определяется автоматически.</div>
                    </div>
                </div>
            </div>
        );
    }

    const taskSummary = Object.entries(selectedConfiguration.tasks ?? {})
        .sort(([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey))
        .map(([, task], index) => {
            const taskKey = String.fromCharCode(65 + index);
            const topics = task.topics?.length ? ` | ${task.topics.join(", ")}` : "";
            return `${taskKey}: уровень ${task.level}${topics}`;
        });
    const orderLabel =
        selectedConfiguration.task_order === "Sequential"
            ? "Задачи открываются одна за другой."
            : "Все задачи доступны сразу.";

    return (
        <div className={configStyles.configItem}>
            <div className={`${configStyles.configSummary} ${styles.selectedConfigSummary}`}>
                <div className={configStyles.configMeta}>
                    Длительность: {selectedConfiguration.max_duration_minutes} мин
                </div>
                <div className={configStyles.configMeta}>
                    {selectedConfiguration.should_show_opponent_solution
                        ? "Показывать код соперника во время дуэли."
                        : "Не показывать код соперника во время дуэли."}
                </div>
                <div className={configStyles.configMeta}>{orderLabel}</div>
                {taskSummary.length > 0 && (
                    <div className={configStyles.taskSummary}>
                        {taskSummary.map((item) => (
                            <div key={item}>{item}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const FriendlyDuelFlow = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const friendlyDuel = useAppSelector(selectFriendlyDuel);
    const {
        phase,
        activeDuelId,
        searchNickname,
        searchConfigurationId,
        searchInvitationType,
        sessionInterrupted,
    } = useAppSelector(selectDuelSession);
    const [createInvitation, { isLoading: isCreatingInvitation }] =
        useCreateDuelInvitationMutation();
    const [showConfigurationManager, setShowConfigurationManager] = useState(false);
    const [editConfiguration, setEditConfiguration] = useState<DuelConfiguration | null>(null);
    const sessionRef = useRef({ phase, activeDuelId });

    sessionRef.current = { phase, activeDuelId };

    useEffect(() => {
        dispatch(setFriendlyDuelUserId(user?.id ?? null));
    }, [dispatch, user?.id]);

    useEffect(() => {
        if (
            friendlyDuel.status === "idle" &&
            phase === "searching" &&
            searchInvitationType === "Friendly" &&
            searchNickname
        ) {
            dispatch(
                restoreFriendlyDuelPending({
                    nickname: searchNickname,
                    configurationId: searchConfigurationId,
                }),
            );
        }
    }, [
        dispatch,
        friendlyDuel.status,
        phase,
        searchConfigurationId,
        searchInvitationType,
        searchNickname,
    ]);

    useEffect(() => {
        if (friendlyDuel.status !== "pending") return;

        if (phase === "active" && activeDuelId) {
            dispatch(matchFriendlyDuel());
            return;
        }

        if (phase === "idle" && !friendlyDuel.isCanceling) {
            dispatch(cancelFriendlyDuel(sessionInterrupted ? "disconnect" : "server"));
        }
    }, [
        activeDuelId,
        dispatch,
        friendlyDuel.isCanceling,
        friendlyDuel.status,
        phase,
        sessionInterrupted,
    ]);

    useEffect(() => {
        if (friendlyDuel.status !== "matched" || !activeDuelId) return;
        navigate(`/duel/${activeDuelId}`);
        dispatch(closeFriendlyDuel());
    }, [activeDuelId, dispatch, friendlyDuel.status, navigate]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nickname = friendlyDuel.nickname.trim();
        if (!nickname || isCreatingInvitation) return;
        if (user?.nickname && nickname.toLowerCase() === user.nickname.toLowerCase()) {
            dispatch(
                failFriendlyDuelCreation({
                    title: "Нельзя вызвать себя на дуэль",
                    description: "Укажите никнейм другого пользователя.",
                }),
            );
            return;
        }

        const configurationId = friendlyDuel.usesDefaultConfiguration
            ? null
            : friendlyDuel.configurationId;

        dispatch(beginFriendlyDuelPending());
        dispatch(setSearchNickname(nickname));
        dispatch(setSearchConfigurationId(configurationId));
        dispatch(setSearchInvitationType("Friendly"));
        dispatch(setSearchTournamentId(null));
        dispatch(setPhase("searching"));

        try {
            await createInvitation({
                opponent_nickname: nickname,
                configuration_id: configurationId ?? undefined,
            }).unwrap();
        } catch (error) {
            if (sessionRef.current.phase === "active" && sessionRef.current.activeDuelId) {
                dispatch(matchFriendlyDuel());
                return;
            }

            dispatch(failFriendlyDuelCreation(getFriendlyDuelCreationError(error)));
            dispatch(setPhase("idle"));
        }
    };

    const isConfigurationScenarioActive = isFriendlyDuelConfigurationScenarioActive(friendlyDuel);
    const cancellationDescription =
        friendlyDuel.cancellationReason === "user"
              ? "Поиск отменён. Выбранные правила и никнейм сохранены для повторного вызова."
              : friendlyDuel.cancellationReason === "disconnect"
                ? "Соединение было прервано, поэтому поиск остановлен."
                : "Соперник отклонил дружескую дуэль";

    return (
        <>
            {isConfigurationScenarioActive && friendlyDuel.step === "configuration" && (
                <div className={styles.overlay}>
                    <div className={styles.configurationPanel}>
                        <IconButton
                            className={styles.closeIconButton}
                            onClick={() => dispatch(closeFriendlyDuel())}
                            aria-label="Закрыть"
                            size="small"
                        >
                            <CrossIcon />
                        </IconButton>
                        <DuelConfigurationPicker
                            className={configStyles.cardFlat}
                            selectedId={friendlyDuel.configurationId}
                            selectedIsDefault={friendlyDuel.usesDefaultConfiguration}
                            onSelect={(id) => dispatch(selectFriendlyDuelConfiguration(id))}
                            onSelectDefault={() =>
                                dispatch(selectFriendlyDuelDefaultConfiguration())
                            }
                            onClearSelection={() =>
                                dispatch(selectFriendlyDuelDefaultConfiguration())
                            }
                            onCreate={() => setShowConfigurationManager(true)}
                            onEdit={(configuration) => {
                                setEditConfiguration(configuration);
                                setShowConfigurationManager(true);
                            }}
                        />
                        <div className={styles.configurationActions}>
                            <Button
                                variant="outlined"
                                onClick={() => dispatch(closeFriendlyDuel())}
                            >
                                Назад
                            </Button>
                            <Button
                                onClick={() => dispatch(showFriendlyDuelOpponentStep())}
                                disabled={
                                    !friendlyDuel.usesDefaultConfiguration &&
                                    friendlyDuel.configurationId === null
                                }
                            >
                                Далее
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isConfigurationScenarioActive && friendlyDuel.step === "opponent" && (
                <div className={styles.overlay}>
                    <div className={styles.panel}>
                        <IconButton
                            className={styles.closeIconButton}
                            onClick={() => dispatch(closeFriendlyDuel())}
                            aria-label="Закрыть"
                            size="small"
                        >
                            <CrossIcon />
                        </IconButton>
                        <h2 className={styles.heading}>Дружеская дуэль</h2>
                        <div className={styles.selectedConfiguration}>
                            <SelectedConfiguration
                                configurationId={friendlyDuel.configurationId}
                                usesDefaultConfiguration={friendlyDuel.usesDefaultConfiguration}
                            />
                        </div>
                        <p className={styles.description}>Укажите ник соперника.</p>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <InputField
                                id="friendly-duel-nickname"
                                labelValue="Никнейм оппонента"
                                wrapperClassName={styles.inputField}
                                labelClassName={styles.inputLabelHidden}
                                inputClassName={styles.input}
                                placeholder="Никнейм"
                                value={friendlyDuel.nickname}
                                onChange={(event) =>
                                    dispatch(setFriendlyDuelNickname(event.target.value))
                                }
                                autoComplete="off"
                            />
                            <div className={styles.formActions}>
                                <Button
                                    variant="outlined"
                                    onClick={() => dispatch(showFriendlyDuelConfigurationStep())}
                                    type="button"
                                >
                                    Назад
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!friendlyDuel.nickname.trim() || isCreatingInvitation}
                                >
                                    {isCreatingInvitation ? "Отправка..." : "Вызов"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConfigurationManager && (
                <DuelConfigurationManager
                    mode="modalOnly"
                    forceFormOpen={showConfigurationManager}
                    onForceFormClose={() => {
                        setShowConfigurationManager(false);
                        setEditConfiguration(null);
                    }}
                    editConfig={editConfiguration}
                    onCreated={(configuration) => {
                        dispatch(selectFriendlyDuelConfiguration(configuration.id));
                        setShowConfigurationManager(false);
                        setEditConfiguration(null);
                    }}
                />
            )}

            {friendlyDuel.status === "canceled" && (
                <Modal
                    title="Дружеская дуэль отменена"
                    onClose={() => dispatch(closeFriendlyDuel())}
                >
                    <p className={styles.resultDescription}>{cancellationDescription}</p>
                    <div className={styles.resultActions}>
                        <Button variant="outlined" onClick={() => dispatch(closeFriendlyDuel())}>
                            Закрыть
                        </Button>
                        <Button onClick={() => dispatch(returnToFriendlyDuelConfiguration())}>
                            Настроить снова
                        </Button>
                    </div>
                </Modal>
            )}

            {friendlyDuel.status === "error" && friendlyDuel.error && (
                <Modal
                    title={friendlyDuel.error.title}
                    onClose={() => dispatch(closeFriendlyDuel())}
                >
                    {friendlyDuel.error.description && (
                        <p className={styles.resultDescription}>{friendlyDuel.error.description}</p>
                    )}
                    <div className={styles.resultActions}>
                        <Button variant="outlined" onClick={() => dispatch(closeFriendlyDuel())}>
                            Закрыть
                        </Button>
                        <Button onClick={() => dispatch(returnToFriendlyDuelConfiguration())}>
                            Исправить и повторить
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
};
