export { UserCard } from "./ui/UserCard/UserCard";
export { BriefUserInfo } from "./ui/BriefUserInfo/BriefUserInfo";

export type { UserData } from "./model/types";

export { useGetUserQuery, useGetMeQuery } from "./api/userApi";

export { userApiSlice } from "./api/userApi";
export { selectCurrentUser } from "./model/selectors";
