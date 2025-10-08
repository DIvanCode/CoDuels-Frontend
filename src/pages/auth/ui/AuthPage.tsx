import { LoginForm, RegisterForm } from "features/auth";
import { useState } from "react";
import { MainCard, TabPanel } from "shared/ui";

import { ITab } from "shared/ui/Tab/Tab";

import styles from "./AuthPage.module.scss";

const AuthPage = () => {
    const [activeAuthTab, setActiveAuthTab] = useState<"login" | "register">("login");

    const authTabs: ITab[] = [
        {
            label: "Вход",
            active: activeAuthTab === "login",
            onClick: () => setActiveAuthTab("login"),
        },
        {
            label: "Регистрация",
            active: activeAuthTab === "register",
            onClick: () => setActiveAuthTab("register"),
        },
    ];

    return (
        <MainCard className={styles.authCard}>
            <TabPanel tabs={authTabs} tabClassName={styles.authTab} />
            {activeAuthTab === "login" ? <LoginForm /> : <RegisterForm />}
        </MainCard>
    );
};

export default AuthPage;
