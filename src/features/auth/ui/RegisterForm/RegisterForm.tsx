import { useLoginMutation, useRegisterMutation } from "features/auth/api/authApi";
import { registrationStruct } from "features/auth/model/authStruct";
import { mapAuthApiError, mapValidationError } from "features/auth/lib/mapAuthError";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, Button } from "shared/ui";
import { validate } from "superstruct";
import type { StatusPayload } from "../../lib/mapAuthError";

import styles from "./RegisterForm.module.scss";

interface RegisterFormProps {
    onStatusChange?: (status: StatusPayload | null) => void;
}

export const RegisterForm = ({ onStatusChange }: RegisterFormProps) => {
    const [nickname, setNickname] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
    const [login, { isLoading: isLoginLoading }] = useLoginMutation();

    const isLoading = isLoginLoading || isRegisterLoading;

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        onStatusChange?.(null);

        const registrationData = { nickname, password, confirmPassword };

        const [error, result] = validate(registrationData, registrationStruct);

        if (error) {
            const payload = mapValidationError(error);
            onStatusChange?.(payload);
            return;
        }

        try {
            await register(result).unwrap();
            await login({ nickname, password }).unwrap();

            onStatusChange?.(null);

            navigate(AppRoutes.INDEX);
        } catch (err) {
            console.log(err);
            const payload = mapAuthApiError(err);
            onStatusChange?.(payload);
        }
    };

    return (
        <form className={styles.registerForm} aria-label="Форма регистрации" onSubmit={onSubmit}>
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
                autoComplete="new-password"
            />
            <InputField
                id="confirm-password"
                labelValue="Повторите пароль"
                placeholder="Пароль"
                value={confirmPassword}
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
            />
            <Button type="submit" disabled={isLoading}>
                Регистрация
            </Button>
        </form>
    );
};
