import { Duel, DuelResultType } from "../model/types";

export function getDuelResultForUser(duel: Duel, userId: number): DuelResultType {
    if (duel.winner_id === null) {
        return "Draw";
    } else if (duel.winner_id === userId) {
        return "Win";
    } else {
        return "Lose";
    }
}
