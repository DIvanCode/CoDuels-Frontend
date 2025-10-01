import { selectCurrentUser } from "entities/user";
import { DuelSessionButton, selectDuelSession } from "features/duel-session";
import { useAppSelector } from "shared/lib/storeHooks";
import { MainCard, SearchLoader } from "shared/ui";

import styles from "./HomePage.module.scss";

interface IdleStateContentProps {
    username: string;
}

const IdleStateContent = ({ username }: IdleStateContentProps) => {
    return (
        <>
            <h2 className={styles.cardHeading}>
                Привет, <span className={styles.username}>{username}</span>!
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

    return (
        <MainCard className={styles.homeCard}>
            {phase === "searching" ? (
                <SearchingStateContent />
            ) : (
                <IdleStateContent username={user?.username ?? "Аноним"} />
            )}
            <DuelSessionButton />
        </MainCard>
    );
};

export default HomePage;
