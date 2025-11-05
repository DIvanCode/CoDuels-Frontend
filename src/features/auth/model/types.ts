import { UserData } from "entities/user";

export interface AuthCredentials {
    nickname: string;
    password: string;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    refreshToken: string | null;
}
