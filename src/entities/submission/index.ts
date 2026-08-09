export {
    submitCodeApiSlice,
    useGetSubmissionDetailQuery,
    useGetSubmissionsQuery,
    useSubmitCodeMutation,
    useGetAdminTestingSubmissionsQuery,
    useGetAdminSubmissionsQuery,
} from "./api/submissionApi";

export type {
    AdminSubmissionItem,
    SubmissionDetail,
    SubmissionItem,
    SubmissionStatus,
    SubmitCodeRequestData,
} from "./model/types";
export { isSubmissionStatusForward } from "./model/submissionStatus";
