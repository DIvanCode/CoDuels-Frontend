import { useLoginMutation } from "features/auth/api/authApi";
import { loginSchema } from "features/auth/model/authSchema";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, SubmitButton } from "shared/ui";

import styles from "./LoginForm.module.scss";

export const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [login, { isLoading }] = useLoginMutation();

    const navigate = useNavigate();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const loginData = { username, password };

        const result = loginSchema.safeParse(loginData);
        if (!result.success) {
            alert(result.error.issues.map((e) => e.message).join("\n"));
        } else {
            await login(loginData);
            navigate(AppRoutes.INDEX);
        }
    };

    return (
        <form className={styles.loginForm} aria-label="Форма входа" onSubmit={onSubmit}>
            <InputField
                id="username"
                labelValue="Никнейм"
                placeholder="Никнейм"
                value={username}
                type="text"
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="on"
            />
            <InputField
                id="password"
                labelValue="Пароль"
                placeholder="Пароль"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
            />
            <SubmitButton disabled={isLoading}>Войти</SubmitButton>
        </form>
    );
};
