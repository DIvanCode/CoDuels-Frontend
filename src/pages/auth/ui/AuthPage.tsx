import { LoginForm, RegisterForm } from "features/auth";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainCard, TabPanel, StatusCard, type StatusVariant, type ITab } from "shared/ui";

import type { StatusPayload } from "features/auth";

import { type AuthTab, resolveAuthTab } from "../lib/authTab";
import styles from "./AuthPage.module.scss";

type AuthStatus = StatusPayload & { variant: StatusVariant };

const AuthPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeAuthTab = resolveAuthTab(searchParams);
    const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
    const [authStatusClosing, setAuthStatusClosing] = useState(false);

    const handleStatusChange = (payload: StatusPayload | null) => {
        if (!payload) {
            setAuthStatus(null);
            return;
        }
        setAuthStatus({ variant: "error", ...payload });
        setAuthStatusClosing(false);
    };

    const switchAuthTab = (tab: AuthTab) => {
        const nextSearchParams = new URLSearchParams(searchParams);
        if (tab === "register") {
            nextSearchParams.set("tab", "register");
        } else {
            nextSearchParams.delete("tab");
        }
        setSearchParams(nextSearchParams, { replace: true });
        setAuthStatus(null);
        setAuthStatusClosing(false);
    };

    useEffect(() => {
        if (!authStatus) {
            setAuthStatusClosing(false);
            return;
        }

        const closingTimeout = setTimeout(() => {
            setAuthStatusClosing(true);
        }, 2700);

        const clearTimeoutId = setTimeout(() => {
            setAuthStatus(null);
            setAuthStatusClosing(false);
        }, 3000);

        return () => {
            clearTimeout(closingTimeout);
            clearTimeout(clearTimeoutId);
        };
    }, [authStatus]);

    const authTabs: ITab[] = [
        {
            label: "Вход",
            active: activeAuthTab === "login",
            onClick: () => switchAuthTab("login"),
        },
        {
            label: "Регистрация",
            active: activeAuthTab === "register",
            onClick: () => switchAuthTab("register"),
        },
    ];

    return (
        <div className={styles.authPage}>
            {authStatus && (
                <StatusCard
                    variant={authStatus.variant}
                    title={authStatus.title}
                    description={authStatus.description}
                    className={styles.statusBanner}
                    closing={authStatusClosing}
                    onClose={() => {
                        setAuthStatusClosing(true);
                        setTimeout(() => {
                            setAuthStatus(null);
                            setAuthStatusClosing(false);
                        }, 200);
                    }}
                />
            )}
            <MainCard className={styles.authCard}>
                <TabPanel tabs={authTabs} tabClassName={styles.authTab} />
                {activeAuthTab === "login" ? (
                    <LoginForm onStatusChange={handleStatusChange} />
                ) : (
                    <RegisterForm onStatusChange={handleStatusChange} />
                )}
            </MainCard>
        </div>
    );
};

export default AuthPage;
