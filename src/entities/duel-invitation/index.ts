export {
    duelInvitationApiSlice,
    useAcceptDuelInvitationMutation,
    useAcceptGroupDuelInvitationMutation,
    useAcceptTournamentDuelInvitationMutation,
    useCancelDuelInvitationMutation,
    useCreateDuelInvitationMutation,
    useCreateGroupDuelInvitationMutation,
    useDenyDuelInvitationMutation,
    useGetDuelInvitationsQuery,
    useLazyGetDuelInvitationsQuery,
} from "./api/duelInvitationApi";
export type { DuelInvitation, PendingDuelType } from "./model/types";
