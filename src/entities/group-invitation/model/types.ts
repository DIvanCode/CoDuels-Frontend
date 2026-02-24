import type { GroupRole } from "entities/group";

export interface GroupInvitation {
    group_id: number;
    group_name: string | null;
    role: GroupRole;
}

export interface GroupInvitationRequest {
    group_id: number;
}
