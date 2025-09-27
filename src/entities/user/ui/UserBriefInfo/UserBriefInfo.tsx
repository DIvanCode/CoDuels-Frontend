import { UserData } from "entities/user/model/types";
import CupIcon from "shared/assets/icons/cup.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";
import { IconButton } from "shared/ui";

import styles from "./UserBriefInfo.module.scss";

type Props = {
    user: UserData;
    onUserIconClick: () => void;
};

export const UserBriefInfo = ({ user, onUserIconClick }: Props) => {
    return (
        <div className={styles.user}>
            <div className={styles.userInfo}>
                <p className={styles.username}>{user.username}</p>
                <div className={styles.rating}>
                    <span>{user.rating}</span>
                    <CupIcon />
                </div>
            </div>
            <IconButton onClick={onUserIconClick}>
                <UserIcon className={styles.userIcon} />
            </IconButton>
        </div>
    );
};
