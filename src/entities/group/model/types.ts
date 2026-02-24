export type GroupRole = "Creator" | "Manager" | "Member";
export type GroupUserStatus = "Active" | "Pending";

export interface Group {
    id: number;
    name: string | null;
    user_role: GroupRole;
}

export interface CreateGroupRequest {
    name: string;
}

export interface InviteGroupUserRequest {
    group_id: number;
    user_id: number;
    role: GroupRole;
}

export interface GroupUser {
    user: import("entities/user").UserData;
    role: GroupRole;
    status: GroupUserStatus;
    invited_by?: import("entities/user").UserData | null;
}
