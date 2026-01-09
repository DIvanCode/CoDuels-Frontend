import { useState } from "react";

import { DuelConfigurationManager } from "features/duel-configuration";
import { DuelSessionButton, selectDuelSession } from "features/duel-session";
import { useAppSelector } from "shared/lib/storeHooks";
import { MainCard, SearchLoader } from "shared/ui";

import { selectCurrentUser } from "entities/user";
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

const SearchingStateContent = () => {
    return (
        <>
            <h2 className={styles.cardHeading}>Поиск оппонента...</h2>

            <SearchLoader />
        </>
    );
};

const HomePage = () => {
    const user = useAppSelector(selectCurrentUser);
    const { phase } = useAppSelector(selectDuelSession);
    const [showConfiguration, setShowConfiguration] = useState(false);

    return (
        <div className={styles.homePage}>
            <MainCard className={styles.homeCard}>
                {phase === "searching" ? (
                    <SearchingStateContent />
                ) : (
                    <IdleStateContent nickname={user?.nickname ?? "Аноним"} />
                )}
                <DuelSessionButton />

                <button
                    type="button"
                    className={styles.configToggle}
                    onClick={() => setShowConfiguration((prev) => !prev)}
                    aria-expanded={showConfiguration}
                    aria-controls="duel-configuration-panel"
                >
                    {showConfiguration ? "Скрыть конфигурации дуэли" : "Настроить дуэль под себя"}
                </button>
            </MainCard>

            <div
                id="duel-configuration-panel"
                className={styles.configPanel}
                data-open={showConfiguration}
            >
                <DuelConfigurationManager />
            </div>
        </div>
    );
};

export default HomePage;
