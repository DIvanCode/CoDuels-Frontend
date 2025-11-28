import { BriefUserInfo, useGetUserQuery } from "entities/user";
import { useGetAllUserDuelsQuery, DuelHistory } from "entities/duel";
import { useParams } from "react-router-dom";
import { ProfileSection } from "../ProfileSectionCard/ProfileSection";

import { UserStats } from "../UserStats/UserStats";
import styles from "./ProfilePage.module.scss";

const ProfilePage = () => {
    const { userId } = useParams();

    const { data: userData, isLoading } = useGetUserQuery(Number(userId), { skip: !userId });

    const { data: userDuels, isLoading: duelsLoading } = useGetAllUserDuelsQuery(Number(userId), {
        skip: !userId,
    });

    if (isLoading || duelsLoading || !userData || !userDuels) {
        return <div>Загрузка...</div>;
    }

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
                    <DuelHistory duels={userDuels} currentUserId={userData.id} />
                </ProfileSection>
            </div>
        </div>
    );
};

export default ProfilePage;
