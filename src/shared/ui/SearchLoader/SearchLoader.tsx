import MapIcon from "shared/assets/icons/map.svg?react";
import SearchIcon from "shared/assets/icons/search.svg?react";

import styles from "./SearchLoader.module.scss";

export const SearchLoader = () => {
    return (
        <div className={styles.searchContainer}>
            <MapIcon className={styles.mapIcon} />
            <SearchIcon className={styles.searchIcon} />
        </div>
    );
};
