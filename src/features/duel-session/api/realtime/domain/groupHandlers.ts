import { groupInvitationApiSlice } from "entities/group-invitation";
import { apiSlice } from "shared/api";

import type { RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";

export const createGroupHandlers = (context: DomainEventContext): RealtimeEventHandlers => {
    const refreshGroups = () => {
        if (isCurrentDomainSession(context)) {
            context.dispatch(apiSlice.util.invalidateTags(["Group"]));
        }
    };
    const refreshMembershipInvitations = () => {
        if (!isCurrentDomainSession(context)) return;
        context.dispatch(
            groupInvitationApiSlice.util.invalidateTags([{ type: "GroupInvitation", id: "LIST" }]),
        );
        refreshGroups();
    };

    return {
        GroupInvitation: [refreshMembershipInvitations],
        GroupInvitationCanceled: [refreshMembershipInvitations],
        GroupDuelInvitation: [refreshGroups],
        GroupDuelInvitationCanceled: [refreshGroups],
    };
};
