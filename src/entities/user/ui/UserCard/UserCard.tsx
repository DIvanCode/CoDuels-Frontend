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
    onClick?: () => void;
    compactOnMobile?: boolean;
    ariaLabel?: string;
}

export const UserCard = ({
    user,
    hideInfo,
    reversed,
    ratingDelta,
    onClick,
    compactOnMobile,
    ariaLabel,
}: Props) => {
    const content = (
        <>
            {!hideInfo && (
                <span className={styles.userInfo}>
                    <span className={styles.nickname}>{user.nickname}</span>
                    <span className={styles.rating}>
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
                    </span>
                </span>
            )}

            <UserIcon className={styles.userIcon} />
        </>
    );

    const className = clsx(
        styles.user,
        reversed && styles.reversed,
        compactOnMobile && styles.compactOnMobile,
        onClick && styles.interactive,
    );

    if (onClick) {
        return (
            <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
                {content}
            </button>
        );
    }

    return <span className={className}>{content}</span>;
};
