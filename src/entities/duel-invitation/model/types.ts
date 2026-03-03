import type { Group } from "entities/group";

export type PendingDuelType = "Ranked" | "Friendly" | "Group";

export interface DuelInvitationBaseDto {
    opponent_nickname: string | null;
    configuration_id?: number | null;
    created_at: string;
}

export interface GroupDuelInvitationDto extends DuelInvitationBaseDto {
    group: Group;
}

export interface DuelInvitation extends DuelInvitationBaseDto {
    type: PendingDuelType;
    group?: Group;
}
