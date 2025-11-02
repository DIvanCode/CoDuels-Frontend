import { useRegisterMutation } from "features/auth/api/authApi";
import { registrationStruct } from "features/auth/model/authStruct";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, SubmitButton } from "shared/ui";
import { validate } from "superstruct";

import styles from "./RegisterForm.module.scss";

export const RegisterForm = () => {
    const [nickname, setNickname] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const [register, { isLoading }] = useRegisterMutation();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const registrationData = { nickname, password, confirmPassword };

        const [error, result] = validate(registrationData, registrationStruct);

        if (error) {
            alert(error.message);
        } else {
            await register(result);
            navigate(AppRoutes.INDEX);
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
            <SubmitButton disabled={isLoading}>Регистрация</SubmitButton>
        </form>
    );
};
