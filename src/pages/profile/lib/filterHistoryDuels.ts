import type { Duel } from "entities/duel";

export const filterHistoryDuels = (duels: Duel[], ratedOnly: boolean): Duel[] =>
    ratedOnly ? duels.filter((duel) => duel.is_rated === true) : duels;
