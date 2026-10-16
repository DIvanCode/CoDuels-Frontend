export interface UserData {
    id: number;
    nickname: string;
    rating: number;
    created_at: string;
}

export interface AdminUserData extends UserData {
    last_seen_at: string | null;
}
