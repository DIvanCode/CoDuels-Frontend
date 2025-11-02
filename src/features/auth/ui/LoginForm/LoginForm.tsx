import { useLoginMutation } from "features/auth/api/authApi";
import { loginStruct } from "features/auth/model/authStruct";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, SubmitButton } from "shared/ui";
import { validate } from "superstruct";

import styles from "./LoginForm.module.scss";

export const LoginForm = () => {
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const [login, { isLoading }] = useLoginMutation();

    const navigate = useNavigate();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const loginData = { nickname, password };

        const [error, result] = validate(loginData, loginStruct);

        if (error) {
            alert(error.message);
        } else {
            await login(result);
            navigate(AppRoutes.INDEX);
        }
    };

    return (
        <form className={styles.loginForm} aria-label="Форма входа" onSubmit={onSubmit}>
            <InputField
                id="nickname"
                labelValue="Никнейм"
                placeholder="Никнейм"
                value={nickname}
                type="text"
                onChange={(e) => setNickname(e.target.value)}
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
