import clsx from "clsx";
import { LoginForm, RegisterForm } from "features/auth";
import { useState } from "react";
import { TabPanel } from "shared/ui";

import styles from "./AuthPage.module.scss";

const AuthPage = () => {
    const [activePageIndex, setActivePageIndex] = useState(0);
    const tabs = ["Вход", "Регистрация"];

    const handleTabChange = (index: number) => {
        setActivePageIndex(index);
    };

    return (
        <div className={clsx("main-card", styles.authCard)}>
            <TabPanel tabs={tabs} onTabChange={handleTabChange} />

            {activePageIndex === 0 ? <LoginForm /> : <RegisterForm />}
        </div>
    );
};

export default AuthPage;
