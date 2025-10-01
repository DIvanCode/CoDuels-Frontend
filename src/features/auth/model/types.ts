import { UserData } from "entities/user";

export interface RegistrationCredentials {
    email: string;
    password: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
}
