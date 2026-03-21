export type TournamentStatus = "New" | "InProgress" | "Finished";
export type TournamentMatchmakingType = "SingleEliminationBracket";

export interface TournamentBracketNode {
    index: number;
    user: import("entities/user").UserData | null;
    winner: import("entities/user").UserData | null;
    duel_id: number | null;
    duel_status: import("entities/duel").Duel["status"] | null;
    left_index: number | null;
    right_index: number | null;
}

export interface SingleEliminationBracket {
    nodes: Array<TournamentBracketNode | null>;
}

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

export interface TournamentDetailsResponse {
    tournament: Tournament;
    single_elimination_bracket?: SingleEliminationBracket | null;
}

export interface CreateTournamentRequest {
    name: string;
    group_id: number;
    matchmaking_type: TournamentMatchmakingType;
    participants: string[];
    duel_configuration_id?: number | null;
}
