import { UserData } from "entities/user/model/types";
import CupIcon from "shared/assets/icons/cup.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";

import clsx from "clsx";
import { AnimatedNumber } from "shared/ui";
import styles from "./UserCard.module.scss";

interface Props {
    user: UserData;
    hideInfo?: boolean;
    reversed?: boolean;
    ratingDelta?: number;
}

export const UserCard = ({ user, hideInfo, reversed, ratingDelta }: Props) => {
    return (
        <div className={clsx(styles.user, reversed && styles.reversed)}>
            {!hideInfo && (
                <div className={styles.userInfo}>
                    <p className={styles.nickname}>{user.nickname}</p>
                    <div className={styles.rating}>
                        <CupIcon />

                        <AnimatedNumber
                            value={
                                ratingDelta !== undefined ? user.rating + ratingDelta : user.rating
                            }
                            from={user.rating}
                        />

                        {ratingDelta !== undefined && (
                            <span className={styles.ratingDelta}>
                                ({ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta})
                            </span>
                        )}
                    </div>
                </div>
            )}

            <UserIcon className={styles.userIcon} />
        </div>
    );
};
