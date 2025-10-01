import { useRegisterMutation } from "features/auth/api/authApi";
import { registrationSchema } from "features/auth/model/authSchema";
import { FormEvent, FormEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { InputField, SubmitButton } from "shared/ui";

import styles from "./RegisterForm.module.scss";

export const RegisterForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const [register, { isLoading }] = useRegisterMutation();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const registrationData = { email, password, confirmPassword };

        const result = registrationSchema.safeParse(registrationData);
        if (!result.success) {
            alert(result.error.issues.map((e) => e.message).join("\n"));
        } else {
            await register(registrationData);
            navigate(AppRoutes.INDEX);
        }
    };

    return (
        <form className={styles.registerForm} aria-label="Форма регистрации" onSubmit={onSubmit}>
            <InputField
                id="email"
                labelValue="Почта"
                placeholder="Почта"
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
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
