export { duelApiSlice } from "./api/duelApi";

export { useGetDuelQuery, useGetAllUserDuelsQuery, useGetCurrentDuelQuery } from "./api/duelApi";

export { DuelResult } from "./ui/DuelResult/DuelResult";
export { DuelHistory } from "./ui/DuelHistory/DuelHistory";

export type { DuelResultType, Duel } from "./model/types";

export { getDuelResultForUser } from "./lib/duelResultHelpers";
