export { duelApiSlice } from "./api/duelApi";

export {
    useGetDuelQuery,
    useGetAllUserDuelsQuery,
    useGetActiveDuelQuery,
    useGetGroupDuelsQuery,
    useGetAdminPendingDuelsQuery,
    useGetAdminRankedDuelSearchersQuery,
    useGetAdminActiveDuelsQuery,
    useGetAdminFinishedDuelsQuery,
} from "./api/duelApi";

export { DuelResult } from "./ui/DuelResult/DuelResult";
export { DuelHistory } from "./ui/DuelHistory/DuelHistory";

export type {
    DuelResultType,
    Duel,
    DuelTaskRef,
    PendingDuel,
    PendingDuelType,
    RankedDuelSearcher,
} from "./model/types";

export { getDuelResultForUser } from "./lib/duelResultHelpers";
export { useDuelTaskSelection } from "./lib/useDuelTaskSelection";
