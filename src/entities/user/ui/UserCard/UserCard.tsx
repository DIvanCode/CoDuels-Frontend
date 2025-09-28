import { UserData } from "entities/user/model/types";
import CupIcon from "shared/assets/icons/cup.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";

import styles from "./UserCard.module.scss";

interface Props {
    user: UserData;
}

export const UserCard = ({ user }: Props) => {
    return (
        <div className={styles.user}>
            <div className={styles.userInfo}>
                <p className={styles.username}>{user.username}</p>
                <div className={styles.rating}>
                    <span>{user.rating}</span>
                    <CupIcon />
                </div>
            </div>

            <UserIcon className={styles.userIcon} />
        </div>
    );
};
