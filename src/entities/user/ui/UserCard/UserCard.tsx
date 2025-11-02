import { UserData } from "entities/user/model/types";
import CupIcon from "shared/assets/icons/cup.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";

import clsx from "clsx";
import styles from "./UserCard.module.scss";

interface Props {
    user: UserData;
    hideInfo?: boolean;
    reversed?: boolean;
}

export const UserCard = ({ user, hideInfo, reversed }: Props) => {
    return (
        <div className={clsx(styles.user, reversed && styles.reversed)}>
            {!hideInfo && (
                <div className={styles.userInfo}>
                    <p className={styles.nickname}>{user.nickname}</p>
                    <div className={styles.rating}>
                        <span>{user.rating}</span>
                        <CupIcon />
                    </div>
                </div>
            )}

            <UserIcon className={styles.userIcon} />
        </div>
    );
};
