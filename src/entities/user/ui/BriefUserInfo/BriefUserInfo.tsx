import UserIcon from "shared/assets/icons/user.svg?react";

import { UserData } from "entities/user";
import styles from "./BriefUserInfo.module.scss";

interface Props {
    user: UserData;
}

export const BriefUserInfo = ({ user }: Props) => {
    return (
        <div className={styles.briefUserInfo}>
            <UserIcon className={styles.userIcon} />

            <div className={styles.userInfo}>
                <div className={styles.infoItem}>
                    <h4 className={styles.infoItemTitle}>Ник</h4>
                    <p className={styles.infoItemValue}>{user.nickname}</p>
                </div>

                <div className={styles.infoItem}>
                    <h4 className={styles.infoItemTitle}>Дата регистрации</h4>
                    <p className={styles.infoItemValue}>{user.created_at}</p>
                </div>
            </div>
        </div>
    );
};
