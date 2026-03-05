export type TournamentStatus = "New" | "InProgress" | "Finished";
export type TournamentMatchmakingType = "SingleEliminationBracket";

export interface Tournament {
    id: number;
    name: string | null;
    status: TournamentStatus;
    group_id: number;
    created_at: string;
    created_by: import("entities/user").UserData;
    participants: import("entities/user").UserData[] | null;
    matchmaking_type: TournamentMatchmakingType;
    duel_configuration_id?: number | null;
}

export interface CreateTournamentRequest {
    name: string;
    group_id: number;
    matchmaking_type: TournamentMatchmakingType;
    participants: string[];
    duel_configuration_id?: number | null;
}
