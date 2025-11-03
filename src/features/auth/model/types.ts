import { UserData } from "entities/user";
import { Infer, object, string } from "superstruct";

export interface AuthCredentials {
    nickname: string;
    password: string;
}

export const TokenPairStruct = object({
    access_token: string(),
    refresh_token: string(),
});

export type TokenPair = Infer<typeof TokenPairStruct>;

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    refreshToken: string | null;
}
