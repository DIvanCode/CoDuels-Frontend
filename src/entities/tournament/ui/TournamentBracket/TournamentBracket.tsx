import type { ComponentType } from "react";

import type { TournamentDetailsResponse, TournamentMatchmakingType } from "../../model/types";
import { SingleEliminationBracketView } from "../SingleEliminationBracketView/SingleEliminationBracketView";

interface TournamentBracketRendererProps {
    data: TournamentDetailsResponse;
}

type TournamentBracketRenderer = ComponentType<TournamentBracketRendererProps>;

const bracketRenderers: Record<TournamentMatchmakingType, TournamentBracketRenderer> = {
    SingleEliminationBracket: SingleEliminationBracketView,
};

interface Props {
    data: TournamentDetailsResponse;
}

export const TournamentBracket = ({ data }: Props) => {
    const Renderer = bracketRenderers[data.tournament.matchmaking_type];

    if (!Renderer) {
        return <div>Для этого типа турнира отображение пока не реализовано.</div>;
    }

    return <Renderer data={data} />;
};
