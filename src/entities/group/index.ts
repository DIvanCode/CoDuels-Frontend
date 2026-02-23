export { groupApiSlice } from "./api/groupApi";

export {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useGetGroupQuery,
    useGetGroupUsersQuery,
    useUpdateGroupMutation,
    useChangeGroupUserRoleMutation,
    useExcludeGroupUserMutation,
    useLeaveGroupMutation,
    useInviteGroupUserMutation,
} from "./api/groupApi";

export type {
    Group,
    GroupRole,
    GroupUser,
    GroupUserStatus,
    CreateGroupRequest,
    InviteGroupUserRequest,
} from "./model/types";
