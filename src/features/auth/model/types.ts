import { UserData } from "entities/user";

export interface AuthCredentials {
    nickname: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    refreshToken: string | null;
}
