import { useLoginMutation } from "features/auth/api/authApi";
import { loginStruct } from "features/auth/model/authStruct";
import { mapAuthApiError, mapValidationError } from "features/auth/lib/mapAuthError";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, Button } from "shared/ui";
import { validate } from "superstruct";
import type { StatusPayload } from "../../lib/mapAuthError";

import styles from "./LoginForm.module.scss";

interface LoginFormProps {
    onStatusChange?: (status: StatusPayload | null) => void;
}

export const LoginForm = ({ onStatusChange }: LoginFormProps) => {
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const [login, { isLoading }] = useLoginMutation();

    const navigate = useNavigate();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        onStatusChange?.(null);

        const loginData = { nickname, password };

        const [error, result] = validate(loginData, loginStruct);

        if (error) {
            const payload = mapValidationError(error);
            onStatusChange?.(payload);
            return;
        }

        try {
            await login(result).unwrap();
            onStatusChange?.(null);
            navigate(AppRoutes.INDEX);
        } catch (err) {
            const payload = mapAuthApiError(err);
            onStatusChange?.(payload);
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
            <Button type="submit" disabled={isLoading}>
                Войти
            </Button>
        </form>
    );
};
