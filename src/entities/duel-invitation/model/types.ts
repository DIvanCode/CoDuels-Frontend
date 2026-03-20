import type { Group } from "entities/group";

export type PendingDuelType = "Ranked" | "Friendly" | "Group" | "Tournament";

export interface DuelInvitationBaseDto {
    opponent_nickname: string | null;
    configuration_id?: number | null;
    created_at: string;
}

export interface GroupDuelInvitationDto extends DuelInvitationBaseDto {
    group: Group;
}

export interface TournamentDuelInvitationDto {
    tournament_id: number;
    tournament_name: string;
    opponent_nickname: string;
    configuration_id?: number | null;
    created_at: string;
}

export interface DuelInvitation extends DuelInvitationBaseDto {
    type: PendingDuelType;
    group?: Group;
    tournament_id?: number;
    tournament_name?: string;
}
