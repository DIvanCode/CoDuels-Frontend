import clsx from "clsx";
import styles from "./UserAvatar.module.scss";

interface Props {
    nickname: string;
    className?: string;
}

export const UserAvatar = ({ nickname, className }: Props) => {
    const initial = Array.from(nickname.trim())[0]?.toLocaleUpperCase() ?? "?";

    return (
        <span className={clsx(styles.avatar, className)} aria-hidden="true">
            {initial}
        </span>
    );
};
