import { LoginForm, RegisterForm } from "features/auth";
import { useState } from "react";
import { MainCard, TabPanel } from "shared/ui";

import styles from "./AuthPage.module.scss";

const AuthPage = () => {
    const [activePageIndex, setActivePageIndex] = useState(0);
    const tabs = ["Вход", "Регистрация"];

    const handleTabChange = (index: number) => {
        setActivePageIndex(index);
    };

    return (
        <MainCard className={styles.authCard}>
            <TabPanel tabs={tabs} onTabChange={handleTabChange} />

            {activePageIndex === 0 ? <LoginForm /> : <RegisterForm />}
        </MainCard>
    );
};

export default AuthPage;
