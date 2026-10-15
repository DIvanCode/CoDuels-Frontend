import { BriefUserInfo, useGetUserByNicknameQuery } from "entities/user";
import { useGetAllUserDuelsQuery, DuelHistory } from "entities/duel";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { filterHistoryDuels } from "../../lib/filterHistoryDuels";
import { ProfileSection } from "../ProfileSectionCard/ProfileSection";

import { UserStats } from "../UserStats/UserStats";
import styles from "./ProfilePage.module.scss";

const ProfilePage = () => {
    const { userNickname } = useParams();
    const [ratedOnly, setRatedOnly] = useState(true);

    useEffect(() => {
        setRatedOnly(true);
    }, [userNickname]);

    const { data: userData, isLoading } = useGetUserByNicknameQuery(userNickname ?? "", {
        skip: !userNickname,
    });

    const { data: userDuels, isLoading: duelsLoading } = useGetAllUserDuelsQuery(
        userData?.id ?? 0,
        {
            skip: !userData?.id,
        },
    );

    if (isLoading || duelsLoading || !userData || !userDuels) {
        return <div>Загрузка...</div>;
    }

    const visibleDuels = filterHistoryDuels(userDuels, ratedOnly);

    return (
        <div className={styles.profilePage}>
            <div className={styles.profileCard}>
                <ProfileSection title="Профиль">
                    <div className={styles.profileInfo}>
                        <BriefUserInfo user={userData} />
                        <UserStats user={userData} userDuels={userDuels} />
                    </div>
                </ProfileSection>

                <ProfileSection title="Дуэли">
                    <label className={styles.ratedOnlyFilter}>
                        <input
                            type="checkbox"
                            checked={ratedOnly}
                            onChange={(event) => setRatedOnly(event.target.checked)}
                        />
                        Только рейтинговые
                    </label>
                    {visibleDuels.length > 0 ? (
                        <DuelHistory duels={visibleDuels} currentUserId={userData.id} />
                    ) : (
                        <p className={styles.emptyHistory} role="status">
                            {ratedOnly ? "Рейтинговых дуэлей пока нет." : "Дуэлей пока нет."}
                        </p>
                    )}
                </ProfileSection>
            </div>
        </div>
    );
};

export default ProfilePage;
