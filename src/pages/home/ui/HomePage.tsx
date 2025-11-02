import { DuelSessionButton, selectDuelSession } from "features/duel-session";
import { useAppSelector } from "shared/lib/storeHooks";
import { MainCard, SearchLoader } from "shared/ui";

import { selectCurrentUser } from "features/auth";
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

    return (
        <MainCard className={styles.homeCard}>
            {phase === "searching" ? (
                <SearchingStateContent />
            ) : (
                <IdleStateContent nickname={user?.nickname ?? "Аноним"} />
            )}
            <DuelSessionButton />
        </MainCard>
    );
};

export default HomePage;
